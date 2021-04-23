type PromiseReturn<T> = T extends PromiseLike<infer U> ? U : T
type PromiseReturnType<T extends (...args: any[]) => any> = PromiseReturn<
  ReturnType<T>
>
