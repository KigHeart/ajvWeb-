import {
  BASELINE_RESEARCH_NOTES,
  type ResearchCategory,
  type ResearchNote,
} from '../data/research';
import { authHeaders } from './authSession';

export interface ResearchNoteInput {
  title: string;
  category: ResearchCategory;
  publishedLabel: string;
  readTime: string;
  summary: string;
  sectors: string;
  findings: string[];
  body: string;
  published: boolean;
}

function isStaticHosting(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io');
}

async function parseError(res: Response, fallback: string): Promise<string> {
  const data: unknown = await res.json().catch(() => null);
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    return data.error;
  }
  return fallback;
}

export async function fetchPublishedResearchNotes(): Promise<ResearchNote[]> {
  if (isStaticHosting()) {
    return BASELINE_RESEARCH_NOTES;
  }
  try {
    const res = await fetch('/api/research');
    if (!res.ok) return BASELINE_RESEARCH_NOTES;
    const data = (await res.json()) as { items?: ResearchNote[] };
    const stored = Array.isArray(data.items) ? data.items : [];
    const seenIds = new Set(stored.map((item) => item.id));
    return [...stored, ...BASELINE_RESEARCH_NOTES.filter((note) => !seenIds.has(note.id))];
  } catch {
    return BASELINE_RESEARCH_NOTES;
  }
}

export async function fetchAdminResearchNotes(): Promise<ResearchNote[]> {
  const res = await fetch('/api/admin/research', { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(await parseError(res, 'Unable to load research notes.'));
  }
  const data = (await res.json()) as { items?: ResearchNote[] };
  return Array.isArray(data.items) ? data.items : [];
}

export async function saveResearchNote(
  id: string | null,
  input: ResearchNoteInput,
): Promise<void> {
  const url = id ? `/api/research/${encodeURIComponent(id)}` : '/api/research';
  const res = await fetch(url, {
    method: id ? 'PUT' : 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'Unable to save research note.'));
  }
}

export async function deleteResearchNote(id: string): Promise<void> {
  const res = await fetch(`/api/research/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'Unable to delete research note.'));
  }
}
