export type AriaNode = {
  role: string;
  /** Accessible name: `Log in` for `button "Log in"`. */
  name: string;
  /** Text after the colon: `Walk the dog` for `listitem: Walk the dog`, or a `text:` node. */
  text: string;
  /** Nodes nested under this one, in document order, `text` nodes included. */
  descendants: AriaNode[];
};

/**
 * Extracts role, accessible name and text from the YAML returned by `locator.ariaSnapshot()`.
 * Returns every node except plain `text` nodes, in document order.
 *
 *   - button "Log in" [disabled]   → { role: 'button', name: 'Log in', text: '' }
 *   - listitem: Walk the dog       → { role: 'listitem', name: '', text: 'Walk the dog' }
 *   - button                       → { role: 'button', name: '', text: '' }
 */
export function parseAriaSnapshot(snapshot: string): AriaNode[] {
  const all: { node: AriaNode; depth: number }[] = [];
  const open: { node: AriaNode; depth: number }[] = [];
  for (const line of snapshot.split('\n')) {
    const match =
      /^(\s*)- '?([a-z]+)(?: "((?:[^"\\]|\\.)*)")?(?: \[[^\]]*\])*'?(?::(?: (.*))?)?$/.exec(line);
    if (!match) continue;
    const depth = match[1].length;
    const node: AriaNode = {
      role: match[2],
      name: unescape(match[3] ?? ''),
      text: yamlScalar(match[4] ?? ''),
      descendants: [],
    };
    while (open.length && open[open.length - 1].depth >= depth) open.pop();
    for (const ancestor of open) ancestor.node.descendants.push(node);
    open.push({ node, depth });
    all.push({ node, depth });
  }
  return all.map(({ node }) => node).filter((node) => node.role !== 'text');
}

function unescape(text: string) {
  return text.replace(/\\(.)/g, '$1');
}

/** `Buy milk` stays, `"Error:"` (quoted because of the colon) becomes `Error:`. */
function yamlScalar(value: string) {
  const trimmed = value.trim();
  if (/^".*"$/.test(trimmed)) return unescape(trimmed.slice(1, -1));
  if (/^'.*'$/.test(trimmed)) return trimmed.slice(1, -1).replace(/''/g, "'");
  return trimmed;
}
