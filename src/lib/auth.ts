const ACCESS_KEY  = 'bem_access';
const REFRESH_KEY = 'bem_refresh';

export const tokenStorage = {
  getAccess:  (): string | null => (typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY)  : null),
  getRefresh: (): string | null => (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null),
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY,  access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export function bearerHeader(): Record<string, string> {
  const t = tokenStorage.getAccess();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
