import { assert } from '@std/assert';

export function div<T extends number | bigint>(x: T, y: T): T {
  let q = (x / y) as unknown as T;
  if (typeof x === 'bigint') {
    const r = mod(x, y);
    // Not only does Math.floor not work for BigInt, it's not needed because
    // `/` does the right thing in the first place.

    // except for numbers of opposite sign
    if ((q < 0n) && (r > 0n)) {
      // There was a remainder.  JS rounded toward zero, but python
      // rounds down.
      q--;
    }
    return q;
  }
  return Math.floor(q as number) as T;
}

/**
 * Modulo, minus the JS bug with negative numbers.
 * `-5 % 4` should be `3`, not `-1`.
 *
 * @param x - Divisor.
 * @param y - Dividend.
 * @returns Result of x mod y.
 * @throws {@link Error} Division by zero.
 */
export function mod<T extends number | bigint>(x: T, y: T): T {
  // == works with either 0 or 0n.
  // deno-lint-ignore eqeqeq
  if (y == 0) {
    throw new Error('Division by zero');
  }
  // @ts-expect-error: TS2365.  tsc can't see that x and y are always the same type
  return ((x % y) + y) % y;
}

/**
 * Integer result of x / y, plus the modulo (unsigned) remainder.
 *
 * @param x - Divisor.
 * @param y - Dividend.
 * @returns The quotient and remainder.
 */
export function divmod<T extends number | bigint>(x: T, y: T): [T, T] {
  let q = (x / y) as unknown as T;
  const r = mod(x, y);
  if (typeof x === 'bigint') {
    // Not only does Math.floor not work for BigInt, it's not needed because
    // `/` does the right thing in the first place.

    // except for numbers of opposite sign
    if ((q < 0n) && (r > 0n)) {
      // There was a remainder.  JS rounded toward zero, but python
      // rounds down.
      q--;
    }
    return [q, r];
  }
  assert(typeof q === 'number');
  return [Math.floor(q) as T, r];
}

export function abs<T extends number | bigint>(a: T): T {
  if (typeof a === 'bigint') {
    return (a < 0 ? -a : a) as T;
  }
  return Math.abs(a) as T;
}

export function sign<T extends number | bigint>(a: T): T {
  if (typeof a === 'bigint') {
    if (a === 0n) {
      return 0n as T;
    }
    return ((a < 0n) ? -1n : 1n) as T;
  }
  return Math.sign(a) as T;
}

export function egcd<T extends number | bigint>(
  a: T,
  b: T,
): [gcd: T, a: T, b: T] {
  const bi = typeof a === 'bigint';
  let [s0, s1] = [bi ? 1n : 1, bi ? 0n : 0] as T[];
  let [t0, t1] = [s1, s0] as T[];

  if (!bi) {
    if ((isNaN(a as number) || isNaN(b as number))) {
      return [NaN as T, NaN as T, NaN as T];
    }
    if ((!isFinite(a as number) || !isFinite(b as number))) {
      return [Infinity as T, Infinity as T, Infinity as T];
    }
  }
  // Needs to work for both 0 and 0n
  // deno-lint-ignore eqeqeq
  if (a == 0) {
    return [b, s1, t1];
  }

  const sa = sign(a);
  const sb = sign(b);
  [a, b] = [abs(a), abs(b)];

  // deno-lint-ignore eqeqeq
  while (b != 0) {
    const [q, r] = divmod(a, b);
    [s0, s1] = [s1, (s0 - (q * s1)) as T];
    [t0, t1] = [t1, (t0 - (q * t1)) as T];
    [a, b] = [b, r];
  }
  return [a, sa * s1 as T, sb * t1 as T];
}

export function gcd<T extends number | bigint>(...n: T[]): T {
  switch (n.length) {
    case 0:
      throw new Error('Invalid input');
    case 1:
      return n[0];
    case 2: {
      let [a, b] = n;
      // Needs to work for both 0 and 0n
      // deno-lint-ignore eqeqeq
      while (b != 0) {
        [a, b] = [b, mod(a, b)];
      }
      return a;
    }
    default:
      return n.reduce((t, v) => gcd(t, v));
  }
}

export function lcm<T extends number | bigint>(...n: T[]): T {
  // TS isn't quite smart enough about generic maths,
  // so there are more `as T` here than I want.
  return n.reduce<T>(
    (t, v) => (((t * v) as T) / gcd(t, v)) as T,
    ((typeof n[0] === 'number') ? 1 : 1n) as T,
  );
}
