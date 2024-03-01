/**
 * Hashes the given text into a number.
 *
 * @param text The text to hash
 * @returns Hash value
 */
export function charcodehash(text: string) {
	const textLength = text.length;

	let value = 0;
	for (let index = 0; index < textLength; ++index) {
		// value += source.charCodeAt(index) * (index + 1);
		value += text.charCodeAt(index);
	}

	return Math.round(value);
}
