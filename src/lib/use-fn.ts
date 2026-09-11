/**
 * Static-hosting shim.
 *
 * The site is deployed as a browser-only bundle, so there are no server
 * functions to bind to a request. Our data helpers are already plain async
 * functions — this hook simply hands them back so existing call sites that
 * were written against `useServerFn` keep working unchanged.
 */
export function useServerFn<T>(fn: T): T {
  return fn;
}
