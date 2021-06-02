/**
 * Generates a unique name, given a starting point (base) and
 * a list of names to avoid conflicts with.
 */
export function uniqueName(base: string, avoid: string[]): string {
  // If the name doesn't already exist we can return it as is
  if (!avoid.includes(base)) {
    return base;
  }

  const numberedName = (name: string, i: number) => `${name} (${i})`;

  // Otherwise find a suffix for the name that makes it unique
  let i = 1;
  while (avoid.includes(numberedName(base, i))) {
    i += 1;
  }
  return numberedName(base, i);
}
