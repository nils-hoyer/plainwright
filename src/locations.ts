import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'tinyglobby';

/**
 * Makes Playwright report the steps' locations in the feature files instead of the test files
 * bddgen generates: `features/login.feature:8` instead of
 * `.features-gen/features/login.feature.spec.js:12`, in the error's code excerpt, its stack and
 * the steps of the report.
 *
 * Each generated file gets a source map built from playwright-bdd's own data at its end: the
 * line of each step, and the line of the step in the feature file. Playwright reads the map when
 * it loads the file. Other lines map to themselves, so tests keep their location in the
 * generated file: playwright-bdd finds a step's location by searching the stack for the test's
 * file, and its Cucumber reporters find a test's data by that file and line. They find steps
 * the same way, so src/reporter.ts gives them the steps' lines in the generated file.
 */
export function mapToFeatures(outputDir: string, configDir: string) {
  for (const file of globSync('**/*.spec.js', { cwd: outputDir, absolute: true })) {
    const code = fs.readFileSync(file, 'utf8');
    if (code.includes(SOURCE_MAP_COMMENT)) continue;
    const mapped = withSourceMap(code, file, configDir);
    if (mapped) fs.writeFileSync(file, mapped);
  }
}

const SOURCE_MAP_COMMENT = '//# sourceMappingURL=data:application/json;base64,';

type BddTestData = {
  pwTestLine: number;
  steps: { pwStepLine?: number; gherkinStepLine: number }[];
};

/**
 * The reverse of the source map, for one test of a generated file: its feature file, and the
 * line of each of its steps in the feature file → the line in the generated file.
 */
export function generatedStepLines(
  code: string,
  testLine: number,
  configDir: string,
): { feature: string; lines: Map<number, number> } | undefined {
  const source = /^\/\/ Generated from: (.+)$/m.exec(code)?.[1];
  const test = bddData(code)?.find((data) => data.pwTestLine === testLine);
  if (!source || !test) return undefined;
  const lines = new Map<number, number>();
  for (const step of test.steps) {
    if (step.pwStepLine) lines.set(step.gherkinStepLine, step.pwStepLine);
  }
  return { feature: path.resolve(configDir, source), lines };
}

/** The generated test file with a source map to its feature file, or undefined if unsure. */
export function withSourceMap(code: string, file: string, configDir: string): string | undefined {
  const source = /^\/\/ Generated from: (.+)$/m.exec(code)?.[1];
  const data = bddData(code);
  if (!source || !data) return undefined;
  const feature = path.resolve(configDir, source);
  if (!fs.existsSync(feature)) return undefined;
  const featureLines = fs.readFileSync(feature, 'utf8').split(/\r?\n/);

  // Line of a step in the generated file → its line in the feature file.
  const lines = new Map<number, number>();
  for (const test of data) {
    for (const step of test.steps) {
      if (step.pwStepLine) lines.set(step.pwStepLine, step.gherkinStepLine);
    }
  }

  const segments = new SegmentWriter();
  const mappings = code.split('\n').map((text, i) => {
    const featureLine = lines.get(i + 1);
    if (featureLine) {
      return segments.add(0, FEATURE, featureLine - 1, indentation(featureLines[featureLine - 1]));
    }
    // To itself, at the start of the line and of its code, so columns stay close.
    const indent = indentation(text);
    const start = segments.add(0, GENERATED, i, 0);
    return indent ? `${start},${segments.add(indent, GENERATED, i, indent)}` : start;
  });
  const map = {
    version: 3,
    file: path.basename(file),
    sources: [path.relative(path.dirname(file), feature), path.basename(file)],
    names: [],
    mappings: mappings.join(';'),
  };
  return `${code.replace(/\n?$/, '\n')}${SOURCE_MAP_COMMENT}${Buffer.from(JSON.stringify(map)).toString('base64')}\n`;
}

const FEATURE = 0;
const GENERATED = 1;

/** The lines between `// bdd-data-start` and `// bdd-data-end`, one test each. */
function bddData(code: string): BddTestData[] | undefined {
  const block = /\/\/ bdd-data-start\n([\s\S]*?)\]; \/\/ bdd-data-end/.exec(code)?.[1];
  if (!block) return undefined;
  try {
    return block
      .split('\n')
      .map((line) => line.trim().replace(/,$/, ''))
      .filter(Boolean)
      .map((line) => JSON.parse(line) as BddTestData);
  } catch {
    return undefined;
  }
}

function indentation(line = '') {
  return line.search(/\S|$/);
}

/**
 * Source map segments: generated column, source, line and column, each as the difference to
 * the previous segment, in base64 VLQ. The generated column restarts on every line.
 */
class SegmentWriter {
  #source = 0;
  #line = 0;
  #column = 0;
  #generatedColumn = 0;

  add(generatedColumn: number, source: number, line: number, column: number): string {
    if (generatedColumn === 0) this.#generatedColumn = 0;
    const segment =
      vlq(generatedColumn - this.#generatedColumn) +
      vlq(source - this.#source) +
      vlq(line - this.#line) +
      vlq(column - this.#column);
    this.#generatedColumn = generatedColumn;
    this.#source = source;
    this.#line = line;
    this.#column = column;
    return segment;
  }
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function vlq(value: number): string {
  let rest = value < 0 ? (-value << 1) | 1 : value << 1;
  let out = '';
  do {
    let digit = rest & 31;
    rest >>>= 5;
    if (rest) digit |= 32;
    out += BASE64[digit];
  } while (rest);
  return out;
}
