import type { AccommodationDto, AccommodationRequest } from '@meghjatra/shared';
import { getAiProvider } from '../ai';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function buildGalleryImages(name: string, count = 3): string[] {
  const slug = slugify(name);
  return Array.from(
    { length: count },
    (_, i) => `https://picsum.photos/seed/${slug}-${i + 1}/800/600`,
  );
}

function buildPartnerDeepLink(name: string): string {
  return `https://partner.example.com/book?hotel=${encodeURIComponent(slugify(name))}`;
}

export async function getAccommodationRecommendations(
  input: AccommodationRequest,
): Promise<AccommodationDto[]> {
  const provider = getAiProvider();
  const generated = await provider.getAccommodationRecommendations(input);

  return generated.map((hotel) => ({
    name: hotel.name,
    rating: hotel.rating,
    pricePerNight: hotel.pricePerNight,
    currency: input.currency,
    amenities: hotel.amenities,
    galleryImageUrls: buildGalleryImages(hotel.name),
    partnerDeepLink: buildPartnerDeepLink(hotel.name),
  }));
}
