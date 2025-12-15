// frontend/src/utils/apiCache.ts
// Simple in-memory cache for API responses

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class APICache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

    /**
     * Get cached data
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if cache has expired
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set cache data
     */
    set<T>(key: string, data: T, ttl?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTTL,
        });
    }

    /**
     * Clear specific cache key
     */
    clear(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clearAll(): void {
        this.cache.clear();
    }

    /**
     * Clear expired entries
     */
    clearExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get cache size
     */
    size(): number {
        return this.cache.size;
    }
}

// Export singleton instance
export const apiCache = new APICache();

// Clear expired cache every 10 minutes
setInterval(() => {
    apiCache.clearExpired();
}, 10 * 60 * 1000);

/**
 * Wrapper function for cached API calls
 */
export async function cachedFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
): Promise<T> {
    // Check cache first
    const cached = apiCache.get<T>(key);
    if (cached !== null) {
        console.log(`✅ Cache HIT: ${key}`);
        return cached;
    }

    // Fetch fresh data
    console.log(`❌ Cache MISS: ${key} - Fetching...`);
    const data = await fetchFn();

    // Store in cache
    apiCache.set(key, data, ttl);

    return data;
}
