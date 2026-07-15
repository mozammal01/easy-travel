import { cn } from '@/lib/utils';

export function MapEmbed({ query, className }: { query: string; className?: string }) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <iframe
      src={src}
      title={`Map of ${query}`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={cn('h-full w-full rounded-md border-0', className)}
    />
  );
}
