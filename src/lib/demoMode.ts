// Demo mode: enabled automatically when Clerk/Convex env vars are missing.
// Keeps the whole app usable with localStorage-backed dummy auth/profile so
// nothing blocks the preview.

export const IS_DEMO =
  !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  !import.meta.env.VITE_CONVEX_URL;

const USER_KEY = "demo_user";
const PROFILE_KEY = "demo_profile";

export interface DemoUser {
  id: string;
  email: string;
  created_at: string;
}

export interface DemoProfile {
  display_name: string | null;
  studienfach: string | null;
  matrikelnummer: string | null;
  hochschule: string | null;
  kurs: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role?: "admin" | "user";
  language_setting?: "english" | "german";
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const demoStore = {
  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  getUser(): DemoUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as DemoUser) : null;
    } catch {
      return null;
    }
  },
  signIn(email: string, displayName?: string) {
    const user: DemoUser = {
      id: "demo-" + Math.random().toString(36).slice(2, 10),
      email,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    const existing = this.getProfile();
    if (!existing) {
      const profile: DemoProfile = {
        display_name: displayName ?? email.split("@")[0],
        studienfach: null,
        matrikelnummer: null,
        hochschule: null,
        kurs: null,
        avatar_url: null,
        created_at: user.created_at,
      };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    }
    emit();
  },
  signOut() {
    localStorage.removeItem(USER_KEY);
    emit();
  },
  getProfile(): DemoProfile | null {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? (JSON.parse(raw) as DemoProfile) : null;
    } catch {
      return null;
    }
  },
  updateProfile(patch: Partial<DemoProfile>) {
    const current = this.getProfile() ?? {
      display_name: null,
      studienfach: null,
      matrikelnummer: null,
      hochschule: null,
      kurs: null,
      avatar_url: null,
      created_at: new Date().toISOString(),
    };
    const next = { ...current, ...patch };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    emit();
  },
};
