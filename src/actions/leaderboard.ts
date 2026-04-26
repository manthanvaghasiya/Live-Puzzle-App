"use server";

import { connectToDatabase } from '../lib/mongodb';
import { Score } from '../lib/models/Score';

export async function submitScore(name: string, timeMs: number) {
  await connectToDatabase();
  await Score.create({ name, timeMs });
  return { success: true };
}

export async function getTopScores() {
  await connectToDatabase();
  const scores = await Score.find({}).sort({ timeMs: 1 }).limit(10).lean();
  return scores.map((s: any) => ({
    _id: s._id.toString(),
    name: s.name,
    timeMs: s.timeMs,
    createdAt: s.createdAt.toISOString()
  }));
}
