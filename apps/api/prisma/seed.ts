import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function placeholderImages(slug: string, count: number): { hero: string; gallery: string[] } {
  return {
    hero: `https://picsum.photos/seed/${slug}/1200/675`,
    gallery: Array.from(
      { length: count },
      (_, i) => `https://picsum.photos/seed/${slug}-${i + 1}/800/600`,
    ),
  };
}

const demoDestinations = [
  {
    name: "Cox's Bazar",
    country: 'Bangladesh',
    region: 'Chittagong Division',
    description: "The world's longest natural sea beach, known for its golden sands and sunsets.",
    budgetLevel: 'budget',
    bestSeason: 'November to March',
    tags: ['beach', 'relaxation', 'seafood'],
  },
  {
    name: 'Bali',
    country: 'Indonesia',
    region: 'Lesser Sunda Islands',
    description: 'Volcanic mountains, rice paddies, beaches, and coral reefs.',
    budgetLevel: 'mid-range',
    bestSeason: 'April to October',
    tags: ['beach', 'culture', 'nature'],
  },
  {
    name: 'Kyoto',
    country: 'Japan',
    region: 'Kansai',
    description: 'Thousands of classical Buddhist temples, gardens, and traditional wooden houses.',
    budgetLevel: 'luxury',
    bestSeason: 'March to May',
    tags: ['culture', 'history', 'temples'],
  },
  {
    name: 'Sapa',
    country: 'Vietnam',
    region: 'Lào Cai Province',
    description: 'Terraced rice fields and mountain trekking through ethnic minority villages.',
    budgetLevel: 'budget',
    bestSeason: 'September to November',
    tags: ['mountains', 'trekking', 'nature'],
  },
  {
    name: 'Swiss Alps',
    country: 'Switzerland',
    region: 'Valais',
    description: 'Iconic snow-capped peaks, alpine lakes, and scenic train routes.',
    budgetLevel: 'luxury',
    bestSeason: 'June to September',
    tags: ['mountains', 'skiing', 'scenery'],
  },
  {
    name: 'Reykjavik',
    country: 'Iceland',
    region: 'Capital Region',
    description: 'Gateway to glaciers, geysers, and the northern lights.',
    budgetLevel: 'luxury',
    bestSeason: 'June to August',
    tags: ['nature', 'adventure', 'scenery'],
  },
  {
    name: 'Marrakech',
    country: 'Morocco',
    region: 'Marrakech-Safi',
    description: 'Bustling souks, ornate palaces, and the gateway to the Sahara.',
    budgetLevel: 'mid-range',
    bestSeason: 'October to April',
    tags: ['culture', 'history', 'shopping'],
  },
  {
    name: 'Queenstown',
    country: 'New Zealand',
    region: 'Otago',
    description: 'Adventure capital with bungee jumping, hiking, and alpine lakes.',
    budgetLevel: 'luxury',
    bestSeason: 'December to February',
    tags: ['adventure', 'mountains', 'nature'],
  },
  {
    name: 'Santorini',
    country: 'Greece',
    region: 'South Aegean',
    description: 'Whitewashed cliffside villages overlooking the caldera.',
    budgetLevel: 'luxury',
    bestSeason: 'April to October',
    tags: ['beach', 'romance', 'scenery'],
  },
  {
    name: 'Cusco',
    country: 'Peru',
    region: 'Cusco Region',
    description: 'Former Incan capital and gateway to Machu Picchu.',
    budgetLevel: 'mid-range',
    bestSeason: 'May to September',
    tags: ['history', 'culture', 'trekking'],
  },
];

async function main() {
  for (const destination of demoDestinations) {
    const slug = destination.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { hero, gallery } = placeholderImages(slug, 3);
    const data = {
      ...destination,
      heroImageUrl: hero,
      galleryImageUrls: gallery,
    };

    await prisma.destination.upsert({
      where: { name_country: { name: destination.name, country: destination.country } },
      update: data,
      create: data,
    });
  }

  console.log(`Seeded ${demoDestinations.length} demo destinations.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
