import {
  adjacentFile,
  defaultArgs,
  parseFile,
  readAllLines,
  readLines,
} from '../utils.ts';
import { assertEquals, assertRejects } from '@std/assert';
import { fromFileUrl } from '@std/path';
import peggy from 'peggy';

const INVALID_FILE = `_____DOES___NOT___EXIST:${Deno.pid}`;
const args = {
  ...defaultArgs,
  dir: fromFileUrl(new URL('./fixtures/', import.meta.url)),
};

Deno.test('Utils', async (t) => {
  await t.step('readLines', async () => {
    let count = 0;
    for await (const _line of readLines(args)) {
      count++;
    }
    assertEquals(count, 2000);
  });

  await t.step('readAllLines', async () => {
    const a = await readAllLines(args);
    assertEquals(a.length, 2000);
  });

  await t.step('parseFile', async () => {
    const r = await parseFile<number[]>(args);
    assertEquals(r.length, 2000);
    const parser: peggy.Parser = {
      SyntaxError: peggy.generate('a = "b"').SyntaxError,
      // @ts-expect-error Peggy type safety?
      parse(): unknown {
        return ['3', '4'];
      },
    };

    const fn = fromFileUrl(
      new URL('./fixtures/inputs/day0.txt', import.meta.url),
    );

    const u = await parseFile<string[]>(args, fn, parser);
    assertEquals(u, ['3', '4']);

    await assertRejects(() => parseFile(args, INVALID_FILE));
    await assertRejects(() =>
      parseFile(
        defaultArgs,
        undefined,
        adjacentFile({ ...args, day: 'Invalid' }, 'peggy', 'test'),
      )
    );
  });
});
