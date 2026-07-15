import type { DiscoveryItemDto, DiscoveryRequest } from '@meghjatra/shared';
import { getAiProvider } from '../ai';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function buildImageUrl(name: string): string {
  return `https://picsum.photos/seed/${slugify(name)}/640/480`;
}

export async function getDiscoveryItems(input: DiscoveryRequest): Promise<DiscoveryItemDto[]> {
  const provider = getAiProvider();
  const generated = await provider.getDiscoveryItems(input);

  return generated.map((item) => ({
    name: item.name,
    category: item.category,
    description: item.description,
    rating: item.rating,
    priceLevel: item.priceLevel,
    tags: item.tags,
    imageUrl: buildImageUrl(item.name),
  }));
}
