import fs from 'node:fs';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestError,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import { generatedStepLines } from './locations';

type Lines = ReturnType<typeof generatedStepLines>;

/**
 * playwright-bdd's Cucumber reporters (`json`, `junit`, `html`, `message`), for tests that run
 * with `plainwright test`. Its source map (src/locations.ts) reports each step at its line in the
 * feature file, and the Cucumber reporters look for steps at their line in the generated test
 * file: without this, every step of a passing test would be "skipped". The other reporters keep
 * the lines in the feature file.
 *
 * Use it with cucumberReporter() from the configuration. defineConfig() also puts it in place of
 * playwright-bdd's.
 */
export default class CucumberReporter implements Reporter {
  readonly #reporter: Reporter;
  readonly #configDir: string;
  readonly #code = new Map<string, string>();
  /** Per generated file and test line. */
  readonly #lines = new Map<string, Lines>();

  constructor(options: { configDir?: string } & Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Adapter = require('playwright-bdd/reporter/cucumber').default;
    this.#reporter = new Adapter(options);
    this.#configDir = options.configDir ?? process.cwd();
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.#reporter.onBegin?.(config, suite);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.#reporter.onTestEnd?.(test, this.#inGeneratedFile(test, result));
  }

  onError(error: TestError) {
    this.#reporter.onError?.(error);
  }

  onEnd(result: FullResult) {
    return this.#reporter.onEnd?.(result);
  }

  printsToStdio() {
    return this.#reporter.printsToStdio?.() ?? true;
  }

  #inGeneratedFile(test: TestCase, result: TestResult): TestResult {
    const { file, line } = test.location;
    const key = `${file}:${line}`;
    if (!this.#code.has(file)) {
      let code = '';
      try {
        code = fs.readFileSync(file, 'utf8');
      } catch {
        // Not a generated file.
      }
      this.#code.set(file, code);
    }
    if (!this.#lines.has(key)) {
      this.#lines.set(key, generatedStepLines(this.#code.get(file)!, line, this.#configDir));
    }
    const lines = this.#lines.get(key);
    return lines ? withGeneratedLines(result, file, lines) : result;
  }
}

/**
 * A copy of the result whose steps from the feature file have their line in the generated file
 * instead. Other reporters share the result, so it stays as it is.
 */
export function withGeneratedLines(
  result: TestResult,
  file: string,
  { feature, lines }: NonNullable<Lines>,
): TestResult {
  const move = (step: TestStep, parent?: TestStep): TestStep => {
    const moved: TestStep = Object.create(step);
    const at = step.location;
    const line = at?.file === feature ? lines.get(at.line) : undefined;
    if (at && line) moved.location = { ...at, file, line };
    Object.assign(moved, { parent, steps: step.steps.map((child) => move(child, moved)) });
    return moved;
  };
  return Object.assign(Object.create(result), { steps: result.steps.map((step) => move(step)) });
}
