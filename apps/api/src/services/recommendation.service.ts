import type { DestinationRecommendation, RecommendationRequest } from '@meghjatra/shared';
import { getAiProvider } from '../ai';

export async function getDestinationRecommendations(
  input: RecommendationRequest,
): Promise<DestinationRecommendation[]> {
  const provider = getAiProvider();
  return provider.getDestinationRecommendations(input);
}
