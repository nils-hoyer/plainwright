import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { withSourceMap } from '../../src/locations';

const dir = path.join(__dirname, 'fixtures/locations');
// A generated test file as bddgen writes it, next to its feature file.
const file = path.join(dir, 'mistakes.feature.spec.js');
const code = fs.readFileSync(path.join(dir, 'mistakes.feature.spec.txt'), 'utf8');

/** Line in the generated file → [source, line] of its first segment, both counted from 1. */
function decode(output: string): Map<number, [string, number]> {
  const map = JSON.parse(Buffer.from(output.split('base64,')[1], 'base64').toString('utf8')) as {
    sources: string[];
    mappings: string;
  };
  const digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const result = new Map<number, [string, number]>();
  let source = 0;
  let line = 0;
  map.mappings.split(';').forEach((segments, i) => {
    for (const [n, segment] of segments.split(',').entries()) {
      const values: number[] = [];
      let value = 0;
      let shift = 0;
      for (const char of segment) {
        const digit = digits.indexOf(char);
        value += (digit & 31) << shift;
        shift += 5;
        if (!(digit & 32)) {
          values.push(value & 1 ? -(value >> 1) : value >> 1);
          value = 0;
          shift = 0;
        }
      }
      source += values[1];
      line += values[2];
      if (n === 0) result.set(i + 1, [map.sources[source], line + 1]);
    }
  });
  return result;
}

describe('locations in feature files', () => {
  it('maps steps to their lines in the feature file, other lines to themselves', () => {
    const lines = decode(withSourceMap(code, file, dir)!);
    expect(lines.get(7)).toEqual(['mistakes.feature', 4]);
    expect(lines.get(11)).toEqual(['mistakes.feature', 7]);
    expect(lines.get(12)).toEqual(['mistakes.feature', 8]);
    // Tests stay in the generated file, where playwright-bdd looks for them.
    expect(lines.get(10)).toEqual(['mistakes.feature.spec.js', 10]);
    expect(lines.get(4)).toEqual(['mistakes.feature.spec.js', 4]);
  });

  it('leaves files it does not understand alone', () => {
    expect(withSourceMap('test("x", () => {});', file, dir)).toBeUndefined();
  });
});
