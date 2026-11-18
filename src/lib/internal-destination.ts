/** Keep hash-router destinations local, without accepting URL-parser escape forms. */
export function internalDestination(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (
    decoded.includes("\\") ||
    Array.from(decoded).some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    ) ||
    decoded.startsWith("//") ||
    /^\/auth(?:[/?#]|$)/i.test(decoded) ||
    decoded
      .split(/[?#]/, 1)[0]
      .split("/")
      .some((part) => part === "." || part === "..")
  )
    return null;
  return value;
}
