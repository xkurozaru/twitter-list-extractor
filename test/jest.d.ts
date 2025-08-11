/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toHaveLength(expected: number): R;
      toMatchObject(expected: any): R;
      toBeGreaterThanOrEqual(expected: number): R;
    }
  }
}

export {};
