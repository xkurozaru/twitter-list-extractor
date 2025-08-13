/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: unknown): R;
      toEqual(expected: unknown): R;
      toHaveLength(expected: number): R;
      toMatchObject(expected: unknown): R;
      toBeGreaterThanOrEqual(expected: number): R;
    }
  }
}

export {};
