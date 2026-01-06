type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const SESSION: StorageLike = sessionStorage;
const LOCAL: StorageLike = localStorage;

const KEY_TOKEN = 'token';
const KEY_USER = 'user';

// Legacy key from older service implementation
const LEGACY_TOKEN_KEYS = ['auth_token'];

const firstNonEmpty = (...values: Array<string | null | undefined>): string | null => {
  for (const v of values) {
    if (typeof v === 'string' && v.trim() !== '') return v;
  }
  return null;
};

export const authStorage = {
  /**
   * Token disimpan di sessionStorage agar otomatis hilang saat tab/browser ditutup.
   * Tetap bisa migrasi dari localStorage bila sebelumnya sudah login.
   */
  getToken(): string | null {
    const sessionToken = SESSION.getItem(KEY_TOKEN);
    const localToken = LOCAL.getItem(KEY_TOKEN);
    const legacyToken = firstNonEmpty(...LEGACY_TOKEN_KEYS.map((k) => LOCAL.getItem(k)));
    return firstNonEmpty(sessionToken, localToken, legacyToken);
  },

  setToken(token: string): void {
    SESSION.setItem(KEY_TOKEN, token);
    // Bersihkan token di localStorage agar tidak dipakai lagi
    LOCAL.removeItem(KEY_TOKEN);
    for (const k of LEGACY_TOKEN_KEYS) LOCAL.removeItem(k);
  },

  getUserRaw(): string | null {
    const sessionUser = SESSION.getItem(KEY_USER);
    const localUser = LOCAL.getItem(KEY_USER);
    return firstNonEmpty(sessionUser, localUser);
  },

  setUserRaw(userJson: string): void {
    SESSION.setItem(KEY_USER, userJson);
    LOCAL.removeItem(KEY_USER);
  },

  clear(): void {
    SESSION.removeItem(KEY_TOKEN);
    SESSION.removeItem(KEY_USER);
    LOCAL.removeItem(KEY_TOKEN);
    LOCAL.removeItem(KEY_USER);
    for (const k of LEGACY_TOKEN_KEYS) LOCAL.removeItem(k);
  },

  /**
   * Jika sebelumnya auth disimpan di localStorage, pindahkan ke sessionStorage.
   */
  migrateLegacyToSession(): void {
    const hasSessionToken = !!SESSION.getItem(KEY_TOKEN);
    const hasSessionUser = !!SESSION.getItem(KEY_USER);

    if (!hasSessionToken) {
      const token = firstNonEmpty(LOCAL.getItem(KEY_TOKEN), ...LEGACY_TOKEN_KEYS.map((k) => LOCAL.getItem(k)));
      if (token) this.setToken(token);
    }

    if (!hasSessionUser) {
      const userRaw = LOCAL.getItem(KEY_USER);
      if (userRaw) this.setUserRaw(userRaw);
    }
  },
};
