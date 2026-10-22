import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generatedStepLines, withSourceMap } from '../../src/locations';
import { withGeneratedLines } from '../../src/reporter';

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

  it('finds the lines of a test in the generated file, for the Cucumber reporters', () => {
    expect(generatedStepLines(code, 10, dir)).toEqual({
      feature: path.join(dir, 'mistakes.feature'),
      lines: new Map([
        [4, 7],
        [7, 11],
        [8, 12],
      ]),
    });
    expect(generatedStepLines(code, 99, dir)).toBeUndefined();
  });

  it('gives the Cucumber reporters a copy of the result with the lines in the generated file', () => {
    const feature = path.join(dir, 'mistakes.feature');
    const keyword = { file: path.join(dir, 'keywords.feature'), line: 4, column: 5 };
    const inner = { title: 'inner', location: keyword, steps: [] as unknown[] };
    const outer = {
      title: 'outer',
      location: { file: feature, line: 7, column: 5 },
      steps: [inner],
    };
    const result = { status: 'passed', steps: [outer] };
    const moved = withGeneratedLines(result as never, file, generatedStepLines(code, 10, dir)!);
    const [step] = moved.steps;
    expect(step.location).toEqual({ file, line: 11, column: 5 });
    expect(step.title).toBe('outer');
    expect(moved.status).toBe('passed');
    // A step in a keyword file keeps its line, even where the feature has a step on that line.
    expect(step.steps[0].location).toEqual(keyword);
    expect(step.steps[0].parent).toBe(step);
    // The HTML report gets the result as it was.
    expect(outer.location.file).toBe(feature);
    expect(result.steps[0]).toBe(outer);
  });
});
