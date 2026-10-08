export type AriaNode = { role: string; name: string };

/**
 * Extracts role and accessible name from the YAML returned by `locator.ariaSnapshot()`.
 *
 *   - button "Log in" [disabled]   → { role: 'button', name: 'Log in' }
 *   - textbox "Username"           → { role: 'textbox', name: 'Username' }
 *   - button                       → { role: 'button', name: '' }
 */
export function parseAriaSnapshot(snapshot: string): AriaNode[] {
  const nodes: AriaNode[] = [];
  for (const line of snapshot.split('\n')) {
    const match = /^\s*- '?([a-z]+)(?: "((?:[^"\\]|\\.)*)")?/.exec(line);
    if (!match || match[1] === 'text') continue;
    nodes.push({ role: match[1], name: (match[2] ?? '').replace(/\\(.)/g, '$1') });
  }
  return nodes;
}
