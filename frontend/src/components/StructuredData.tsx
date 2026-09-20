import React from "react";

interface StructuredDataProps {
  data: Record<string, any> | Record<string, any>[];
}

/**
 * Injects Google Rich Result compliant Schema.org JSON-LD scripts into the head / page.
 */
export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}
