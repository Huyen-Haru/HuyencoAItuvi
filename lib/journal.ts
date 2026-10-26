'use client';
/**
 * Nhật ký "dự báo vs thực tế": mỗi hồ sơ một sổ, mỗi ngày một ghi chú.
 */
import { useCallback, useEffect, useState } from 'react';

export type Outcome = 'good' | 'neutral' | 'bad';

export interface JournalEntry {
  note: string;
  outcome: Outcome;
  tags: string[];
  /** Điểm dự báo tại thời điểm ghi, để đối chiếu */
  forecast?: number;
  updatedAt: number;
}

export type Journal = Record<string, JournalEntry>;  // key = yyyy-mm-dd

const KEY = 'tuvi_journal_v1';
const EVENT = 'tuvi-journal-changed';

export const JOURNAL_TAGS = ['Công việc', 'Tiền bạc', 'Gia đình', 'Tình cảm', 'Sức khỏe', 'Đi lại', 'Ký kết', 'Gặp gỡ'];

function readAll(): Record<string, Journal> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useJournal(profileId: string | null) {
  const [journal, setJournal] = useState<Journal>({});

  useEffect(() => {
    const sync = () => setJournal(profileId ? readAll()[profileId] ?? {} : {});
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [profileId]);

  const saveEntry = useCallback((key: string, entry: JournalEntry | null) => {
    if (!profileId) return;
    const all = readAll();
    const mine = { ...(all[profileId] ?? {}) };
    if (entry) mine[key] = entry;
    else delete mine[key];
    all[profileId] = mine;
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* bỏ qua */ }
    window.dispatchEvent(new Event(EVENT));
  }, [profileId]);

  return { journal, saveEntry };
}
