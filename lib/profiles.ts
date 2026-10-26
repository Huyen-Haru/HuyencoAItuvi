'use client';
/**
 * Hồ sơ lá số (bản thân, gia đình, khách hàng) lưu trong trình duyệt.
 */
import { useCallback, useEffect, useState } from 'react';
import type { BirthInfo } from '@/lib/ziwei/types';

export interface Profile {
  id: string;
  name: string;
  gender: 'male' | 'female';
  /** Ngày sinh dương lịch */
  year: number;
  month: number;
  day: number;
  /** Giờ sinh đồng hồ 0–23, phút 0–59; null nếu không rõ */
  hour: number | null;
  minute: number;
  place?: string;
  relation?: string;   // Bản thân, Vợ/Chồng, Con, Khách hàng…
  note?: string;
  createdAt: number;
}

const KEY = 'tuvi_profiles_v1';
const ACTIVE_KEY = 'tuvi_active_profile_v1';
const EVENT = 'tuvi-profiles-changed';

function read(): Profile[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile[]) : [];
  } catch {
    return [];
  }
}

function readActive(): string | null {
  try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}

function write(list: Profile[], active?: string | null) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    if (active !== undefined) {
      if (active) localStorage.setItem(ACTIVE_KEY, active);
      else localStorage.removeItem(ACTIVE_KEY);
    }
  } catch { /* bộ nhớ trình duyệt bị chặn */ }
  window.dispatchEvent(new Event(EVENT));
}

/** Giờ đồng hồ → chỉ số giờ địa chi (0 = Tý). 23h thuộc giờ Tý của ngày hôm sau. */
export function clockToBranch(hour: number): number {
  return Math.floor((hour + 1) / 2) % 12;
}

export function profileToBirthInfo(p: Profile): BirthInfo {
  const hour = p.hour ?? 0;
  return {
    year: p.year,
    month: p.month,
    day: p.day,
    hour: clockToBranch(hour),
    lateZi: p.hour === 23,
    gender: p.gender,
    name: p.name,
  };
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      const list = read();
      let act = readActive();
      if (act && !list.some(p => p.id === act)) act = null;
      if (!act && list.length) act = list[0].id;
      setProfiles(list);
      setActiveId(act);
      setReady(true);
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const save = useCallback((p: Omit<Profile, 'id' | 'createdAt'> & { id?: string }, activate = true) => {
    const list = read();
    const id = p.id ?? `p${Date.now().toString(36)}`;
    const existing = list.find(x => x.id === id);
    const next: Profile = { ...p, id, createdAt: existing?.createdAt ?? Date.now() };
    const updated = existing ? list.map(x => (x.id === id ? next : x)) : [...list, next];
    write(updated, activate ? id : undefined);
    return next;
  }, []);

  const remove = useCallback((id: string) => {
    const updated = read().filter(p => p.id !== id);
    write(updated, readActive() === id ? updated[0]?.id ?? null : undefined);
  }, []);

  const select = useCallback((id: string) => write(read(), id), []);

  const active = profiles.find(p => p.id === activeId) ?? null;
  return { profiles, active, activeId, ready, save, remove, select };
}

export function formatBirth(p: Profile): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const time = p.hour === null ? 'không rõ giờ' : `${pad(p.hour)}:${pad(p.minute)}`;
  return `${pad(p.day)}/${pad(p.month)}/${p.year} · ${time}`;
}
