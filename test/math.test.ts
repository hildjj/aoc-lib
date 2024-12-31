import { divmod, egcd, gcd, lcm, mod } from '../math.ts';
import { assertEquals, assertThrows } from '@std/assert';

Deno.test('math', async (t) => {
  await t.step('divmod', () => {
    assertEquals(divmod<number>(4, 4), [1, 0]);
    assertEquals(divmod<number>(-5, 4), [-2, 3]);

    assertEquals(divmod<bigint>(4n, 4n), [1n, 0n]);
    assertEquals(divmod<bigint>(-5n, 4n), [-2n, 3n]);
    assertEquals(divmod<bigint>(-5n, -4n), [1n, -1n]);

    assertThrows(() => divmod(4, 0), Error, 'Division by zero');
    assertThrows(() => divmod(4n, 0n), Error, 'Division by zero');
  });

  await t.step('mod', () => {
    assertEquals(mod<number>(4, 4), 0);
    assertEquals(mod<number>(-5, 4), 3);
    assertEquals(mod<bigint>(4n, 4n), 0n);
    assertEquals(mod<bigint>(-5n, 4n), 3n);
    assertEquals(mod<bigint>(-5n, -4n), -1n);
    assertThrows(() => mod(4, 0), Error, 'Division by zero');
    assertThrows(() => mod(4n, 0n), Error, 'Division by zero');
  });

  await t.step('gcd', () => {
    assertThrows(() => gcd());
    assertEquals(gcd(8), 8);
    assertEquals(gcd(8n), 8n);
    assertEquals(gcd(8, 12), 4);
    assertEquals(gcd(8n, 12n), 4n);
    assertEquals(gcd(8, 12, 16), 4);
    assertEquals(gcd(8n, 12n, 16n), 4n);
  });

  await t.step('egcd', () => {
    assertEquals(egcd(0, 0), [0, 0, 1]);
    assertEquals(egcd(0n, 0n), [0n, 0n, 1n]);
    assertEquals(egcd(NaN, 0), [NaN, NaN, NaN]);
    assertEquals(egcd(0, NaN), [NaN, NaN, NaN]);
    assertEquals(egcd(Infinity, 0), [Infinity, Infinity, Infinity]);
    assertEquals(egcd(240, 46), [2, 23, -120]);
    assertEquals(egcd(240n, 46n), [2n, 23n, -120n]);
    assertEquals(egcd(4n, 0n), [4n, 0n, 0n]);
  });

  await t.step('lcm', () => {
    assertEquals(lcm(8, 12), 24);
    assertEquals(lcm(8n, 12n), 24n);
  });
});
