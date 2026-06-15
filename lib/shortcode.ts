import { customAlphabet } from "nanoid";

// Unambiguous base-58-ish alphabet (no 0/O/I/l) for readable short codes.
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

export function makeShortCode(length = 6): string {
  return customAlphabet(ALPHABET, length)();
}
