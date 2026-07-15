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

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'BDT', 'INR', 'JPY', 'AUD', 'CAD'] as const;
export type Currency = (typeof CURRENCIES)[number];
