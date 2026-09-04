import "server-only";

import { GoogleGenAI } from "@google/genai";

import { serverEnv } from "@/shared/config/env.server";

export const gemini = new GoogleGenAI({ apiKey: serverEnv.geminiApiKey });
