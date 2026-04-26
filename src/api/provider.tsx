/**
 * ApiProvider — supplies the singleton ApiClient via React context.
 *
 * Plus: a tiny `useAsync` hook that gives screens a uniform pattern
 * for "load some data" + "do an action" without pulling in a full
 * data-fetching library. Suitable for a thesis prototype; can be
 * replaced by TanStack Query later.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ApiClient } from './contract';

const ApiContext = createContext<ApiClient | null>(null);

export function ApiProvider({
  client,
  children,
}: {
  client: ApiClient;
  children: ReactNode;
}) {
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiClient {
  const c = useContext(ApiContext);
  if (!c) throw new Error('useApi() must be called inside <ApiProvider>');
  return c;
}

/* ───────── useAsync — minimal data hook ───────── */

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  /** Re-run the loader. */
  reload: () => void;
}

/**
 * Run an async loader on mount and whenever `deps` change.
 *
 * The `loader` is called with the latest API client. It must return a
 * Promise whose result is the data to expose.
 */
export function useAsync<T>(
  loader: (api: ApiClient) => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
): AsyncState<T> {
  const api = useApi();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const seq = useRef(0);

  const run = useCallback(() => {
    const mySeq = ++seq.current;
    setLoading(true);
    setError(null);
    loader(api)
      .then((value) => {
        if (mySeq !== seq.current) return;
        setData(value);
      })
      .catch((e: unknown) => {
        if (mySeq !== seq.current) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (mySeq !== seq.current) return;
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, ...deps]);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  return { data, loading, error, reload: run };
}

/* ───────── useMutation — minimal action hook ───────── */

export interface MutationState<TArgs extends unknown[], TResult> {
  run: (...args: TArgs) => Promise<TResult>;
  loading: boolean;
  error: Error | null;
}

export function useMutation<TArgs extends unknown[], TResult>(
  fn: (api: ApiClient, ...args: TArgs) => Promise<TResult>,
): MutationState<TArgs, TResult> {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn(api, ...args);
        return result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [api],
  );

  return { run, loading, error };
}
