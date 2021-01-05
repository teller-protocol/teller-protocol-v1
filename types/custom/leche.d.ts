declare module 'leche' {
  export function withData<T>(scenarios: { [testName: string]: T }, testFn: (variables: T) => void): void
}