import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@lifeos.app" },
    update: {},
    create: {
      email: "demo@lifeos.app",
      name: "Demo User",
      passwordHash: hash,
      startDate: new Date("2026-08-24"),
    },
  });

  // sample goals
  const goals = [
    { name: "Become SDE-2 ready", domain: "Career", progress: 62, health: "yellow", target: "2027-03-01", metric: "Interview readiness" },
    { name: "Solve 400 quality DSA problems", domain: "DSA", progress: 48, health: "green", target: "2027-06-01", metric: "Problems solved" },
    { name: "Publish 150 technical videos", domain: "Content", progress: 31, health: "yellow", target: "2027-08-01", metric: "Videos published" },
    { name: "Emergency fund ₹5L", domain: "Finance", progress: 68, health: "green", target: "2027-01-01", metric: "Savings" },
  ];
  for (const g of goals) {
    await prisma.goal.create({ data: { ...g, userId: user.id } });
  }

  // habits
  const habits = ["Wake by 5:30", "DSA (min 1 problem)", "Workout", "Track expenses", "Read 20 pages"];
  for (const name of habits) {
    await prisma.habit.create({ data: { name, userId: user.id, streak: 7 + Math.floor(Math.random() * 15) } });
  }

  // demat holdings
  const holdings = [
    { symbol: "RELIANCE", name: "Reliance Industries", quantity: 10, avgPrice: 2450, currentPrice: 2780, assetType: "Equity", broker: "Zerodha" },
    { symbol: "TCS", name: "Tata Consultancy", quantity: 5, avgPrice: 3600, currentPrice: 3850, assetType: "Equity", broker: "Zerodha" },
    { symbol: "NIFTYBEES", name: "Nippon India ETF Nifty BeES", quantity: 100, avgPrice: 220, currentPrice: 245, assetType: "ETF", broker: "Zerodha" },
    { symbol: "PARAGPARIKH", name: "Parag Parikh Flexi Cap", quantity: 150.5, avgPrice: 65, currentPrice: 78, assetType: "Mutual Fund", broker: "Groww" },
  ];
  for (const h of holdings) {
    await prisma.dematHolding.create({ data: { ...h, userId: user.id } });
  }

  console.log("Seed complete. Login: demo@lifeos.app / password123");
}

main().finally(() => prisma.$disconnect());
