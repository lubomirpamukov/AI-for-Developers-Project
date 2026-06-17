export interface ServerEnv {
  port: number;
  geminiApiKey?: string;
}

export function getEnv(): ServerEnv {
  return {
    port: Number(process.env.PORT ?? 3001),
    geminiApiKey: process.env.GEMINI_API_KEY
  };
}
