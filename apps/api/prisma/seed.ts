import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const demoDestinations = [
  {
    name: 'Cox\'s Bazar',
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
];

async function main() {
  for (const destination of demoDestinations) {
    await prisma.destination.upsert({
      where: { name_country: { name: destination.name, country: destination.country } },
      update: destination,
      create: destination,
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
