from __future__ import annotations

import re
import uuid
from typing import Any

from supabase import Client, create_client


_PHONE_RE = re.compile(r"^\+?\d[\d\s\-()]{7,}$")


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
            .select("id,status,telegram_chat_id")
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
