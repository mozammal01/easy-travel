import type {
  AccommodationRequest,
  ChatContext,
  ChatMessage,
  CreateTripInput,
  DestinationRecommendation,
  DiscoveryRequest,
  GeneratedDayPlan,
  RecommendationRequest,
} from '@meghjatra/shared';
import type { GeneratedAccommodation } from './accommodationPrompt';
import type { GeneratedDiscoveryItem } from './discoveryPrompt';

export interface AiProvider {
  getDestinationRecommendations(
    input: RecommendationRequest,
  ): Promise<DestinationRecommendation[]>;
  generateItinerary(input: CreateTripInput, totalDays: number): Promise<GeneratedDayPlan[]>;
  getAccommodationRecommendations(
    input: AccommodationRequest,
  ): Promise<GeneratedAccommodation[]>;
  getDiscoveryItems(input: DiscoveryRequest): Promise<GeneratedDiscoveryItem[]>;
  chat(messages: ChatMessage[], context?: ChatContext): Promise<string>;
}
