import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

/**
 * Rate limiter en memoria para el relayer.
 * Por defecto: 60 requests por IP por minuto.
 * Los límites se configuran con las env vars RATE_LIMIT_MAX y RATE_LIMIT_WINDOW_MS.
 */

interface BucketEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketEntry>();

const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX ?? 60);
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000); // 1 minuto

/**
 * Extrae una clave representativa del cliente (IP o header X-Forwarded-For).
 */
function getKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}

/**
 * Limpia entradas expiradas para evitar crecimiento ilimitado del mapa.
 * Se llama cada vez que se comprueba el rate limit.
 */
function purgeExpired() {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  purgeExpired();
  const key = getKey(req);
  const now = Date.now();

  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
    return next();
  }

  bucket.count += 1;

  if (bucket.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    logger.warn("Rate limit exceeded", {
      key,
      count: bucket.count,
      max: MAX_REQUESTS,
      retryAfterSec: retryAfter,
    });
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({
      error: "Too many requests. Please slow down.",
      retryAfterSec: retryAfter,
    });
  }

  next();
}
