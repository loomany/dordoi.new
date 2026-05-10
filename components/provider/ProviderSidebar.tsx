import { Building2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  vendorName: string;
  statusOnlineLabel: string;
  statusOfflineLabel: string;
  online: boolean;
  contactWhatsAppLabel: string;
  saveLabel: string;
  responseLabel: string;
  deliveryLabel: string;
  whatsappHref: string;
  quickInfoTitle?: string;
};

export function ProviderSidebar({
  vendorName,
  statusOnlineLabel,
  statusOfflineLabel,
  online,
  contactWhatsAppLabel,
  saveLabel,
  responseLabel,
  deliveryLabel,
  whatsappHref,
  quickInfoTitle,
}: Props) {
  return (
    <aside
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24",
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-gray-400">
          <Building2 className="size-8" aria-hidden />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900">{vendorName}</h2>
        <p className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500">
          <span
            className={cn("size-2 rounded-full", online ? "bg-green-500" : "bg-gray-300")}
            aria-hidden
          />
          {online ? statusOnlineLabel : statusOfflineLabel}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl bg-green-500 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-green-600"
        >
          {contactWhatsAppLabel}
        </a>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
        >
          <Heart className="size-4 text-gray-500" aria-hidden />
          {saveLabel}
        </button>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-6 text-left">
        {quickInfoTitle ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {quickInfoTitle}
          </p>
        ) : null}
        <ul className="mt-3 space-y-2 text-sm text-gray-500">
          <li>{responseLabel}</li>
          <li>{deliveryLabel}</li>
        </ul>
      </div>
    </aside>
  );
}
