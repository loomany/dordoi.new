import { CreditCard, Package, Truck } from "lucide-react";

type TermProps = {
  moq: string;
  payment: string;
  shipping: string;
  moqLabel: string;
  paymentLabel: string;
  shippingLabel: string;
};

export function ProviderTermsGrid({
  moq,
  payment,
  shipping,
  moqLabel,
  paymentLabel,
  shippingLabel,
}: TermProps) {
  const cells = [
    { Icon: Package, label: moqLabel, value: moq },
    { Icon: CreditCard, label: paymentLabel, value: payment },
    { Icon: Truck, label: shippingLabel, value: shipping },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cells.map(({ Icon, label, value }) => (
        <div
          key={label}
          className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <Icon className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
