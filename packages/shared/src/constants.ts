export const TRAVEL_INTERESTS = [
  'Beach',
  'Mountains',
  'Culture',
  'Food',
  'Nightlife',
  'Adventure',
  'Relaxation',
  'Wildlife',
  'History',
  'Shopping',
] as const;

export type TravelInterest = (typeof TRAVEL_INTERESTS)[number];
