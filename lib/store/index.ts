import "server-only";
import type { Store } from "./store";
import { fileStore } from "./file";
import { hasRedisEnv, redisStore } from "./redis";

/**
 * Pick the backend automatically:
 *  - Upstash Redis / Vercel KV when its env vars are present (production on Vercel)
 *  - a local JSON file otherwise (zero-setup local development)
 */
export const store: Store = hasRedisEnv() ? redisStore : fileStore;

export const storeBackend: "redis" | "file" = hasRedisEnv() ? "redis" : "file";

export type { Store } from "./store";
