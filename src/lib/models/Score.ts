import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  timeMs: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Score = mongoose.models.Score || mongoose.model('Score', scoreSchema);
