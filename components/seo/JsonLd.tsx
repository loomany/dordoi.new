type Props = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Inline JSON-LD for structured data (Schema.org). */
export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
