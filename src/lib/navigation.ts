export function buildAppRoute(pathname: string, search: string, overrides: Record<string, string | undefined> = {}): string {
  const sourceParams = new URLSearchParams(search);
  const nextParams = new URLSearchParams();

  for (const key of ['demo', 'judge']) {
    if (sourceParams.has(key)) {
      nextParams.set(key, sourceParams.get(key) || '1');
    }
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === 'string' && value.trim()) {
      nextParams.set(key, value.trim());
    }
  }

  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}