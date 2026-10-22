import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkSessionTag, keptSession, sessionFile } from '../../src/session';

/** A project folder with these kept sessions: undefined for all scenarios, else a tag. */
function project(...kept: (string | undefined)[]) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plainwright-session-'));
  for (const tag of kept) {
    fs.mkdirSync(path.dirname(sessionFile(tag, dir)), { recursive: true });
    fs.writeFileSync(sessionFile(tag, dir), '{}');
  }
  return dir;
}

describe('kept sessions', () => {
  it('are stored in playwright/.auth, one per tag', () => {
    expect(sessionFile(undefined, '/p')).toBe(path.resolve('/p/playwright/.auth/session.json'));
    expect(sessionFile('@admin', '/p')).toBe(path.resolve('/p/playwright/.auth/@admin.json'));
    expect(sessionFile('@team:a/b', '/p')).toBe(path.resolve('/p/playwright/.auth/@team_a_b.json'));
  });

  it('start a scenario with the session kept for its tag, else the one for all', () => {
    const dir = project(undefined, '@admin');
    expect(keptSession([], dir)).toBe(sessionFile(undefined, dir));
    expect(keptSession(['@orders'], dir)).toBe(sessionFile(undefined, dir));
    expect(keptSession(['@orders', '@admin'], dir)).toBe(sessionFile('@admin', dir));
  });

  it('leave out @setup and @logged-out scenarios, and every scenario before one is kept', () => {
    const dir = project(undefined, '@admin');
    expect(keptSession(['@setup'], dir)).toBeUndefined();
    expect(keptSession(['@logged-out', '@admin'], dir)).toBeUndefined();
    expect(keptSession(['@admin'], project())).toBeUndefined();
    // Only @admin scenarios start logged in.
    const tagged = project('@admin');
    expect(keptSession([], tagged)).toBeUndefined();
    expect(keptSession(['@admin'], tagged)).toBe(sessionFile('@admin', tagged));
  });

  it('are kept for a tag', () => {
    expect(checkSessionTag('@admin')).toBeNull();
    expect(checkSessionTag('admin')).toBe(
      '"admin" is not a tag. Write the tag the scenarios have, with @, such as "@admin".',
    );
    expect(checkSessionTag('@logged-out')).toBe(
      '@logged-out scenarios start without a kept session. Keep it for another tag, such as "@admin".',
    );
  });
});
