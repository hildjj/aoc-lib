import { join } from '@std/path';
import { TextLineStream } from '@std/streams';
import peggy from 'peggy';

export interface MainArgs {
  day: string;
  trace?: boolean;
  _?: (string | number)[];
  dir: string;
  [x: string]: unknown;
}

export type MainEntry<T> = (args: MainArgs) => Promise<T>;

export const defaultArgs: MainArgs = {
  trace: false,
  day: '0',
  _: [],
  dir: Deno.cwd(),
};

const grammarCache: Record<string, peggy.Parser> = {};
const inputCache: Record<string, string> = {};
const inputLinesCache: Record<string, string[]> = {};

/**
 * Read file, parse lines.
 *
 * @param args - Args passed in to day.ts
 * @param filename - If null, figures out what day today is
 *   and finds the .txt file.
 * @returns One entry per line.
 */
export async function* readLines(
  args: MainArgs,
  filename?: string,
): AsyncGenerator<string, undefined, undefined> {
  if (!filename) {
    if (args._?.length) {
      filename = String(args._[0]);
    } else {
      filename = adjacentFile(args, 'txt', 'inputs');
    }
  }

  let lines = inputLinesCache[filename];
  if (lines) {
    yield* lines;
    return;
  }

  lines = [];
  const f = await Deno.open(filename);
  const ts = f.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  for await (const s of ts) {
    if (s.length) {
      yield s;
      lines.push(s);
    }
  }
  inputLinesCache[filename] = lines;
}

/**
 * Read all non-blank lines from a file, returning an array.
 *
 * @param args - Args passed in to day.ts
 * @param filename - If null, figures out what day today is
 *   and finds the .txt file.
 * @returns One entry per line.
 */
export async function readAllLines(
  args: MainArgs,
  filename?: string,
): Promise<string[]> {
  const res: string[] = [];
  for await (const line of readLines(args, filename)) {
    res.push(line);
  }
  return res;
}

/**
 * Parse a file.
 *
 * @param args - CLI args
 * @param input - If null, figures out what day today is
 *   and finds the .txt file.
 * @param parser - If a string, the name of the parser
 *   file to require.  If a function, the pre-required parser.  If null,
 *   find the parser with the matching name. If no parser found, split
 *   like `readLines`.
 * @returns The output of the parser.
 */
export async function parseFile<T>(
  args: MainArgs,
  input?: string,
  parser?:
    | string
    | peggy.Parser,
): Promise<T> {
  let text: string | undefined = undefined;
  let source: string | undefined;

  if (!parser) {
    source = adjacentFile(args, 'peggy');
  } else if (typeof parser === 'string') {
    source = parser;
    parser = undefined;
  }

  try {
    let compiled = (parser as peggy.Parser) ?? grammarCache[source!];
    if (!compiled) {
      text = await Deno.readTextFile(source!);

      compiled = peggy.generate(text, {
        trace: args.trace,
        grammarSource: source,
      });
      grammarCache[source!] = compiled;
    }
    source = input;
    if (!source) {
      if (args._?.length) {
        source = String(args._[0]);
      } else {
        source = adjacentFile(args, 'txt', 'inputs');
      }
    }
    text = inputCache[source];
    if (!text) {
      text = await Deno.readTextFile(source);
      inputCache[source] = text;
    }

    const res = compiled.parse(text, {
      grammarSource: source,
      sourceMap: 'inline',
      format: 'es',
    }) as T;
    performance.mark(args.day);
    return res;
  } catch (e) {
    const er = e as peggy.GrammarError;
    if (typeof er.format === 'function') {
      er.message = (er as peggy.GrammarError).format([
        { source, text: text! },
      ]);
    }
    throw er;
  }
}

/**
 * @returns The file with the given extension next to the calling file.
 */
export function adjacentFile(
  args: MainArgs,
  ext: string,
  ...dir: string[]
): string {
  return join(args.dir, ...dir, `day${args.day}.${ext}`);
}

/**
 * Create an array of the given length from a callback.
 *
 * @param length
 * @param cb
 * @returns
 */
export function toArray<T>(length: number, cb: (k: number) => T): T[] {
  return Array.from({ length }, (_v, k) => cb(k));
}
