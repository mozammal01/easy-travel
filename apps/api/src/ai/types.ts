import type { DestinationRecommendation, RecommendationRequest } from '@meghjatra/shared';

export interface AiProvider {
  getDestinationRecommendations(
    input: RecommendationRequest,
  ): Promise<DestinationRecommendation[]>;
}
