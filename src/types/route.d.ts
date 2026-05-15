type ExtractParams<T extends string> =
  T extends `${infer _Start}[${infer Param}]${infer Rest}`
    ? { [K in Param | keyof ExtractParams<Rest>]: string }
    : Record<never, never>

interface DynContext<T extends string> {
  params: Promise<ExtractParams<T>>
}
