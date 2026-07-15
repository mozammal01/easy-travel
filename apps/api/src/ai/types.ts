import type {
  CreateTripInput,
  DestinationRecommendation,
  GeneratedDayPlan,
  RecommendationRequest,
} from '@meghjatra/shared';

export interface AiProvider {
  getDestinationRecommendations(
    input: RecommendationRequest,
  ): Promise<DestinationRecommendation[]>;
  generateItinerary(input: CreateTripInput, totalDays: number): Promise<GeneratedDayPlan[]>;
}
