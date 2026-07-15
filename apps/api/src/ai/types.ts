import type {
  AccommodationRequest,
  CreateTripInput,
  DestinationRecommendation,
  GeneratedDayPlan,
  RecommendationRequest,
} from '@meghjatra/shared';
import type { GeneratedAccommodation } from './accommodationPrompt';

export interface AiProvider {
  getDestinationRecommendations(
    input: RecommendationRequest,
  ): Promise<DestinationRecommendation[]>;
  generateItinerary(input: CreateTripInput, totalDays: number): Promise<GeneratedDayPlan[]>;
  getAccommodationRecommendations(
    input: AccommodationRequest,
  ): Promise<GeneratedAccommodation[]>;
}
