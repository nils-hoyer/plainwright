export function levenshtein(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}

/**
 * The candidate that `text` most likely misspells: the same apart from capitals, or from five
 * letters on, one letter in four off. `Delet` → `Delete` and `save` → `Save`, but not
 * `Edit` → `Exit`, which may be a different button.
 */
export function closest(text: string, candidates: readonly string[]): string | undefined {
  const lower = text.toLowerCase();
  const allowed = text.length < 5 ? 0 : Math.floor(text.length / 4);
  let best: { candidate: string; distance: number } | undefined;
  for (const candidate of candidates) {
    if (candidate === text) continue;
    const distance = levenshtein(lower, candidate.toLowerCase());
    if (distance > allowed) continue;
    if (!best || distance < best.distance) best = { candidate, distance };
  }
  return best?.candidate;
}
