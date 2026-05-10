from __future__ import annotations

import re
import uuid
from typing import Any

from supabase import Client, create_client


_PHONE_RE = re.compile(r"^\+?\d[\d\s\-()]{7,}$")

# Совпадают с supabase/migrations/20250511120000_showcase_vendors.sql — без реального Telegram.
_SHOWCASE_VENDOR_IDS = frozenset({
    "10000000-0000-4000-8000-000000000001",
    "10000000-0000-4000-8000-000000000002",
})


def validate_phone(raw: str) -> str | None:
    s = " ".join(raw.split())
    if not _PHONE_RE.match(s):
        return None
    digits = re.sub(r"\D", "", s)
    if len(digits) < 10:
        return None
    return s


def normalize_contact_phone(raw: str | None) -> str | None:
    if not raw:
        return None
    s = raw.strip()
    if len(s) < 8:
        return None
    return s


class VendorRepository:
    def __init__(self, url: str, service_role_key: str) -> None:
        self._base_url = url.rstrip("/")
        self._client: Client = create_client(url, service_role_key)

    def public_object_url(self, bucket: str, object_path: str) -> str:
        return (
            f"{self._base_url}/storage/v1/object/public/{bucket}/{object_path}"
        )

    def upload_public_image(
        self,
        bucket: str,
        telegram_chat_id: int,
        file_body: bytes,
        filename_hint: str,
        content_type: str,
    ) -> tuple[str, str]:
        safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", filename_hint)[:120]
        object_path = f"{telegram_chat_id}/{uuid.uuid4().hex}_{safe_name}"
        self._client.storage.from_(bucket).upload(
            object_path,
            file_body,
            file_options={"content-type": content_type},
        )
        return object_path, self.public_object_url(bucket, object_path)

    def get_vendor_by_telegram(self, telegram_chat_id: int) -> dict[str, Any] | None:
        res = (
            self._client.table("vendors")
            .select("id,status,telegram_chat_id,store_name,language,slug,approved_at")
            .eq("telegram_chat_id", telegram_chat_id)
            .limit(1)
            .execute()
        )
        rows = res.data
        if isinstance(rows, list) and rows and isinstance(rows[0], dict):
            return rows[0]
        return None

    def insert_vendor(self, row: dict[str, Any]) -> dict[str, Any]:
        res = self._client.table("vendors").insert(row).execute()
        data = res.data
        if isinstance(data, list) and data and isinstance(data[0], dict):
            return data[0]
        if isinstance(data, dict):
            return data
        raise RuntimeError("Unexpected Supabase insert response")

    # --- vendor_photo_batches ---------------------------------------------

    def create_pending_photo_batch(self, vendor_id: str) -> str:
        """Создаёт новую pending-партию фото для approved-продавца. Возвращает её id."""
        res = (
            self._client.table("vendor_photo_batches")
            .insert({"vendor_id": vendor_id, "status": "pending_moderation"})
            .execute()
        )
        data = res.data
        if isinstance(data, list) and data and isinstance(data[0], dict):
            row = data[0]
        elif isinstance(data, dict):
            row = data
        else:
            raise RuntimeError("Unexpected create_pending_photo_batch response")
        batch_id = row.get("id")
        if not isinstance(batch_id, str):
            raise RuntimeError("create_pending_photo_batch: missing id")
        return batch_id

    def append_photo_batch_item(
        self,
        batch_id: str,
        photo_url: str,
        position: int,
    ) -> None:
        self._client.table("vendor_photo_batch_items").insert(
            {
                "batch_id": batch_id,
                "photo_url": photo_url,
                "position": position,
            }
        ).execute()

    def delete_photo_batch(self, batch_id: str) -> None:
        self._client.table("vendor_photo_batches").delete().eq("id", batch_id).execute()

    def list_vendors_due_for_photo_reminder(
        self,
        cutoff_iso: str,
    ) -> list[dict[str, Any]]:
        """
        Approved-продавцы, которые «проседают» по свежести:
          last_photo_reminder_at либо NULL, либо < cutoff_iso.
        Финальный фильтр по «последней активности» (approved_at vs последняя approved-партия)
        делаем уже в Python, потому что у Supabase сложно сравнивать с подзапросом.
        """
        res = (
            self._client.table("vendors")
            .select("id,telegram_chat_id,store_name,language,slug,approved_at,last_photo_reminder_at")
            .eq("status", "approved")
            .or_(
                f"last_photo_reminder_at.is.null,last_photo_reminder_at.lt.{cutoff_iso}"
            )
            .execute()
        )
        rows = res.data if isinstance(res.data, list) else []
        return [
            r
            for r in rows
            if isinstance(r, dict) and r.get("id") not in _SHOWCASE_VENDOR_IDS
        ]

    def latest_approved_photo_batch_at(self, vendor_id: str) -> str | None:
        res = (
            self._client.table("vendor_photo_batches")
            .select("created_at")
            .eq("vendor_id", vendor_id)
            .eq("status", "approved")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        data = res.data if isinstance(res.data, list) else []
        if data and isinstance(data[0], dict):
            v = data[0].get("created_at")
            if isinstance(v, str):
                return v
        return None

    def mark_photo_reminder_sent(self, vendor_id: str, sent_iso: str) -> None:
        self._client.table("vendors").update(
            {"last_photo_reminder_at": sent_iso}
        ).eq("id", vendor_id).execute()
