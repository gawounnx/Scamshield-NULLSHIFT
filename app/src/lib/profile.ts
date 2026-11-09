// Age group and guardian, stored on this device only (SPEC.md: no login, no server copy).

export type AgeGroup = "MINOR" | "ADULT" | "SENIOR";
export type Relation = "PARENT" | "CHILD" | "OTHER";

export interface Guardian {
  name: string;
  phone: string;
  relation: Relation;
}

export interface Profile {
  ageGroup: AgeGroup;
  guardian: Guardian | null;
}

const KEY = "scamshield.profile.v1";
const listeners = new Set<() => void>();
// Fallback when localStorage is blocked (private mode), so onboarding still completes.
let memory: string | null = null;

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? memory ?? "";
  } catch {
    return memory ?? "";
  }
}

export function subscribeProfile(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// "" = no profile yet, null = not readable yet (server render).
export const getProfileSnapshot = (): string => read();
export const getServerProfileSnapshot = (): string | null => null;

export function saveProfile(profile: Profile): void {
  memory = JSON.stringify(profile);
  try {
    localStorage.setItem(KEY, memory);
  } catch {
    // Keep the in-memory copy for this session.
  }
  listeners.forEach((listener) => listener());
}

export function parseProfile(raw: string): Profile | null {
  try {
    const value = JSON.parse(raw) as Profile;
    if (!["MINOR", "ADULT", "SENIOR"].includes(value.ageGroup)) return null;
    return { ageGroup: value.ageGroup, guardian: value.guardian ?? null };
  } catch {
    return null;
  }
}

export const guardianRequired = (age: AgeGroup) => age === "MINOR";
