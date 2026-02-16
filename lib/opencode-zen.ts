import OpenAI from 'openai';

const OPENCODE_ZEN_BASE_URL = process.env.OPENCODE_ZEN_BASE_URL || 'https://api.opencode.com/v1';

export const opencodeZen = new OpenAI({
  apiKey: process.env.OPENCODE_ZEN_API_KEY,
  baseURL: OPENCODE_ZEN_BASE_URL,
});

export const FREE_MODELS = {
  MINIMAX: 'minimax-m2.5-free',
  KIMI: 'kimi-k2.5-free',
  BIG_PICKLE: 'big-pickle',
} as const;

export type FreeModel = typeof FREE_MODELS[keyof typeof FREE_MODELS];
