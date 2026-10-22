import fs from 'node:fs';
import path from 'node:path';

/**
 * Logging in once: scenarios tagged `@setup` run before the others (`setup: true` in
 * defineConfig()) and keep the browser's session with `I keep the session`. Every other scenario
 * then starts with it, except those tagged `@logged-out`. `I keep the session for "@admin"
 * scenarios` keeps one for the scenarios with that tag instead.
 */
export const SETUP_TAG = '@setup';
export const LOGGED_OUT_TAG = '@logged-out';

/** The steps that keep a session, which only work in a scenario tagged `@setup`. */
export const SETUP_STEPS = ['I keep the session', 'I keep the session for {string} scenarios'];

/** Where kept sessions are stored, relative to the project folder. `init` keeps it out of git. */
export const SESSION_FOLDER = 'playwright/.auth';

/** The file of the session for scenarios with this tag, or for all scenarios. */
export function sessionFile(tag?: string, cwd = process.cwd()): string {
  const name = tag ? tag.replace(/[^\p{L}\p{N}@._-]/gu, '_') : 'session';
  return path.resolve(cwd, SESSION_FOLDER, `${name}.json`);
}

/**
 * The session a scenario with these tags starts with: the one kept for one of its tags, else
 * the one kept for all scenarios. None for `@setup` and `@logged-out` scenarios.
 */
export function keptSession(tags: readonly string[], cwd = process.cwd()): string | undefined {
  if (tags.includes(SETUP_TAG) || tags.includes(LOGGED_OUT_TAG)) return undefined;
  return [...tags.map((tag) => sessionFile(tag, cwd)), sessionFile(undefined, cwd)].find((file) =>
    fs.existsSync(file),
  );
}

/** Why a session cannot be kept for this tag, or null when it can. */
export function checkSessionTag(tag: string): string | null {
  if (!/^@[^@\s]+$/.test(tag)) {
    return `"${tag}" is not a tag. Write the tag the scenarios have, with @, such as "@admin".`;
  }
  if (tag === SETUP_TAG || tag === LOGGED_OUT_TAG) {
    return `${tag} scenarios start without a kept session. Keep it for another tag, such as "@admin".`;
  }
  return null;
}
