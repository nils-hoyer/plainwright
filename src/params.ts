import { ParameterType, ParameterTypeRegistry } from '@cucumber/cucumber-expressions';
import { defineParameterType as defineBddParameterType } from 'playwright-bdd';
import { ELEMENT_REGEXP, toElementRef } from './elements';

export type ParameterTypeOptions<T> = {
  name: string;
  regexp: RegExp | string | readonly RegExp[] | readonly string[];
  transformer?: (...match: string[]) => T;
  useForSnippets?: boolean;
  preferForRegexpMatch?: boolean;
};

/** Parameter types known to our step registry (playwright-bdd keeps its own copy). */
export const parameterTypes = new ParameterTypeRegistry();

/** Parameter types defined with defineParameterType(), including `{element}` and `{number}`. */
export const customParameterTypes: { name: string; regexps: RegExp[] }[] = [];

/**
 * Defines a custom parameter type, e.g. `{color}`, for both playwright-bdd and the step registry.
 * Use this instead of playwright-bdd's `defineParameterType` so keywords and lint know the type.
 */
export function defineParameterType<T>(options: ParameterTypeOptions<T>) {
  parameterTypes.defineParameterType(
    new ParameterType(
      options.name,
      options.regexp,
      null,
      options.transformer ?? ((value: string) => value as T),
      options.useForSnippets ?? true,
      options.preferForRegexpMatch ?? false,
    ),
  );
  const regexps = [options.regexp].flat().map((r) => (typeof r === 'string' ? new RegExp(r) : r));
  customParameterTypes.push({ name: options.name, regexps });
  defineBddParameterType(options);
}

/**
 * Built-in types. playwright-bdd may know them already when this module is loaded a second
 * time in the same process (e.g. two copies of the package); that definition is the same.
 */
function defineBuiltInParameterType<T>(options: ParameterTypeOptions<T>) {
  try {
    defineParameterType(options);
  } catch (error) {
    if (!/already a parameter type/.test(String(error))) throw error;
  }
}

// `"Log in" button` → ElementRef
defineBuiltInParameterType({
  name: 'element',
  regexp: ELEMENT_REGEXP,
  transformer: toElementRef,
  useForSnippets: false,
});

// `"3"` → 3. Numbers are quoted like every other value.
defineBuiltInParameterType({
  name: 'number',
  regexp: /"(-?\d+(?:\.\d+)?)"/,
  transformer: (value: string) => Number(value),
  useForSnippets: false,
});
