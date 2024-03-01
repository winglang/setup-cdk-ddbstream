import { customAlphabet } from "nanoid";

/**
 * Generates a random string of 22 characters with the following characteristics:
 * - URL friendly
 * - 1% probability of at least one collision after generating 1000 IDs per second for ~842 billion years
 */
export const nanoid62 = customAlphabet(
	"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
	22,
);

/**
 * Generates a random string of 25 characters with the following characteristics:
 * - no look-alike characters
 * - safe from obscene words
 * - URL friendly
 * - 1% probability of at least one collision after generating 1000 IDs per second for ~460 billion years
 */
export const nanoid36 = customAlphabet("6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz", 25);
