import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
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

    const goalCount = await prisma.goal.count({ where: { userId: user.id } });
    if (goalCount === 0) {
      await prisma.goal.createMany({
        data: [
          { userId: user.id, name: "Become SDE-2 ready", domain: "Career", progress: 62, health: "yellow", target: "2027-03-01", metric: "Interview readiness" },
          { userId: user.id, name: "Solve 400 quality DSA problems", domain: "DSA", progress: 48, health: "green", target: "2027-06-01", metric: "Problems solved" },
          { userId: user.id, name: "Emergency fund ₹5L", domain: "Finance", progress: 68, health: "green", target: "2027-01-01", metric: "Savings" },
        ],
      });
    }

    const habitCount = await prisma.habit.count({ where: { userId: user.id } });
    if (habitCount === 0) {
      await prisma.habit.createMany({
        data: [
          { userId: user.id, name: "Wake by 5:30", streak: 18 },
          { userId: user.id, name: "DSA (min 1 problem)", streak: 12 },
          { userId: user.id, name: "Workout", streak: 9 },
          { userId: user.id, name: "Track expenses", streak: 22 },
        ],
      });
    }

    const dematCount = await prisma.dematHolding.count({ where: { userId: user.id } });
    if (dematCount === 0) {
      await prisma.dematHolding.createMany({
        data: [
          { userId: user.id, symbol: "RELIANCE", name: "Reliance Industries", quantity: 10, avgPrice: 2450, currentPrice: 2780, assetType: "Equity", broker: "Zerodha" },
          { userId: user.id, symbol: "TCS", name: "Tata Consultancy", quantity: 5, avgPrice: 3600, currentPrice: 3850, assetType: "Equity", broker: "Zerodha" },
          { userId: user.id, symbol: "NIFTYBEES", name: "Nifty BeES ETF", quantity: 100, avgPrice: 220, currentPrice: 245, assetType: "ETF", broker: "Zerodha" },
          { userId: user.id, symbol: "PPFAS", name: "Parag Parikh Flexi Cap", quantity: 150.5, avgPrice: 65, currentPrice: 78, assetType: "Mutual Fund", broker: "Groww" },
        ],
      });
    }

    return NextResponse.json({ ok: true, userId: user.id, email: user.email });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
