/**
 * Wisdom Guild API Client (Stub)
 *
 * Japanese MTG market pricing from wonder.wisdom-guild.net
 * Requires API key and secret key from Wisdom Guild administrators.
 * Authentication: HMAC-SHA256 signature-based
 *
 * API Documentation: http://wonder.wisdom-guild.net/api/card-price/manual.php
 *
 * HOW TO GET API ACCESS:
 * 1. Register an account at http://wonder.wisdom-guild.net/
 * 2. Contact Wisdom Guild administrators via website contact form or email
 * 3. Request API access (provide use case: personal MTG price tracking app)
 * 4. Receive api_key (user ID) and secret_key (password)
 * 5. Set WISDOMGUILD_API_KEY and WISDOMGUILD_SECRET_KEY in .env
 */

import crypto from "crypto";

export interface WisdomGuildCard {
  name: string;
  nameJa: string;
  setCode: string;
  priceJpy: number;       // Price in Japanese Yen
  priceJpyFoil?: number;
  lastUpdated: string;
}

const WISDOMGUILD_BASE_URL = "http://wonder.wisdom-guild.net/api/card-price/v1/";

/**
 * Generate HMAC-SHA256 signature for Wisdom Guild API authentication
 * @param queryString Sorted query parameters (e.g., "api_key=xxx&card_name=Black+Lotus&timestamp=1234567890")
 */
function generateSignature(queryString: string, secretKey: string): string {
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(queryString);
  return hmac.digest("hex");
}

/**
 * Search for a card by name and get JPY pricing
 * @param cardName Card name (English or Japanese)
 */
export async function searchCardPrice(cardName: string): Promise<WisdomGuildCard | null> {
  const apiKey = process.env.WISDOMGUILD_API_KEY;
  const secretKey = process.env.WISDOMGUILD_SECRET_KEY;

  if (!apiKey || !secretKey) {
    console.warn("[Wisdom Guild] API credentials not configured.");
    console.warn("Set WISDOMGUILD_API_KEY and WISDOMGUILD_SECRET_KEY in .env");
    console.warn("See server/wisdom-guild.ts for application instructions.");
    return null;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);

    // Build query parameters (sorted by key, RFC 1738 encoding with spaces as +)
    const params: Record<string, string> = {
      api_key: apiKey,
      card_name: cardName,
      timestamp: timestamp.toString(),
    };

    // Sort parameters by key
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys
      .map((key) => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`)
      .join("&");

    // Generate HMAC-SHA256 signature
    const signature = generateSignature(queryString, secretKey);

    // Make request with signature
    const url = `${WISDOMGUILD_BASE_URL}?${queryString}&api_sig=${signature}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) {
        console.error("[Wisdom Guild] Authentication failed. Check API credentials.");
        return null;
      }
      if (response.status === 404) {
        console.log(`[Wisdom Guild] Card not found: ${cardName}`);
        return null;
      }
      throw new Error(`Wisdom Guild API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Parse response (format depends on actual API response structure)
    // TODO: Update this based on actual API response format
    return {
      name: data.name || cardName,
      nameJa: data.name_ja || "",
      setCode: data.set_code || "",
      priceJpy: data.price_jpy || 0,
      priceJpyFoil: data.price_jpy_foil,
      lastUpdated: data.updated_at || new Date().toISOString(),
    };
  } catch (error: any) {
    console.error(`[Wisdom Guild] Failed to fetch price for "${cardName}":`, error.message);
    return null;
  }
}

/**
 * Check if Wisdom Guild API is configured
 */
export function isConfigured(): boolean {
  return !!(process.env.WISDOMGUILD_API_KEY && process.env.WISDOMGUILD_SECRET_KEY);
}
