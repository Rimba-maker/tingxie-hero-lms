import "server-only";

import { GoogleGenAI } from "@google/genai";

import { getServerEnv } from "@/shared/config/env.server";

// Lazily created on first use (see env.client.ts for why).
let client: GoogleGenAI | undefined;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const { geminiApiKey } = getServerEnv();
    client = new GoogleGenAI({ apiKey: geminiApiKey });
  }
  return client;
}
