import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'tinyglobby';
import { defineKeywords } from './keywords';
import { appPagesFile, definePages } from './pages';
import { defineData } from './values';

/**
 * Loads the files a project keeps in the usual places, so it needs no step file for them:
 *
 * - `.env`: environment variables for `{env.NAME}`. Variables already set win.
 * - `pages/**\/*.json`: named pages, one per file, see definePages().
 * - `data/**\/*.json`: test data, see defineData().
 * - `keywords/**\/*.feature`: keywords, see defineKeywords().
 *
 * Runs when the package is loaded, in the current working directory (the project folder).
 */
export function loadProjectFiles(cwd = process.cwd()) {
  const env = path.join(cwd, '.env');
  if (isFile(env)) process.loadEnvFile(env);
  if (isDirectory(path.join(cwd, 'pages'))) loadPages(cwd);
  if (isDirectory(path.join(cwd, 'data'))) defineData('data', { cwd });
  if (globSync('keywords/**/*.feature', { cwd }).length) {
    defineKeywords('keywords/**/*.feature', { cwd });
  }
}

function loadPages(cwd: string) {
  const app = appPagesFile(cwd);
  if (app) {
    console.warn(
      `[plainwright] pages/ holds app files such as ${app}, so Plainwright does not load ` +
        `pages from it. Keep your page files in another folder and load it with ` +
        `definePages('<folder>') in a file in steps/.`,
    );
    return;
  }
  definePages('pages', { cwd });
}

function isFile(file: string) {
  return fs.statSync(file, { throwIfNoEntry: false })?.isFile() ?? false;
}

function isDirectory(dir: string) {
  return fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory() ?? false;
}
