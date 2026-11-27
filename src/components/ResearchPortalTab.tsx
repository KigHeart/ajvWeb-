import { useEffect, useState, type FormEvent } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import {
  RESEARCH_CATEGORIES,
  type ResearchCategory,
  type ResearchNote,
} from '../data/research';
import {
  deleteResearchNote,
  fetchAdminResearchNotes,
  saveResearchNote,
  type ResearchNoteInput,
} from '../lib/research';

interface ResearchPortalTabProps {
  onResearchUpdated?: () => void;
}

const EMPTY_FORM: ResearchNoteInput = {
  title: '',
  category: 'Workflow Discovery',
  publishedLabel: '2026',
  readTime: '4 min read',
  summary: '',
  sectors: '',
  findings: [],
  body: '',
  published: true,
};

export function ResearchPortalTab({ onResearchUpdated }: ResearchPortalTabProps) {
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ResearchNoteInput>(EMPTY_FORM);
  const [findingsText, setFindingsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const loadNotes = async () => {
    setError('');
    try {
      const items = await fetchAdminResearchNotes();
      setNotes(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load research notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotes();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFindingsText('');
    setSavedNotice(false);
  };

  const selectForEdit = (note: ResearchNote) => {
    setEditingId(note.id);
    setForm({
      title: note.title,
      category: note.category,
      publishedLabel: note.publishedLabel,
      readTime: note.readTime,
      summary: note.summary,
      sectors: note.sectors,
      findings: note.findings,
      body: note.body,
      published: note.published,
    });
    setFindingsText(note.findings.join('\n'));
    setSavedNotice(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSavedNotice(false);

    const cleanFindings = findingsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 6);

    if (!form.title.trim() || !form.summary.trim() || !form.body.trim()) {
      setError('Title, summary, and full research note body are required.');
      return;
    }

    setSaving(true);
    try {
      await saveResearchNote(editingId, {
        ...form,
        title: form.title.trim().slice(0, 140),
        publishedLabel: form.publishedLabel.trim().slice(0, 40) || '2026',
        readTime: form.readTime.trim().slice(0, 24) || '4 min read',
        summary: form.summary.trim().slice(0, 360),
        sectors: form.sectors.trim().slice(0, 140),
        findings: cleanFindings,
        body: form.body.trim().slice(0, 6000),
      });
      await loadNotes();
      onResearchUpdated?.();
      setSavedNotice(true);
      if (!editingId) {
        resetForm();
        setSavedNotice(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save research note.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    try {
      await deleteResearchNote(id);
      if (editingId === id) {
        resetForm();
      }
      await loadNotes();
      onResearchUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove research note.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="font-display text-base font-semibold text-[#0B2228]">
              Published &amp; Draft Research
            </h4>
            <p className="text-xs text-[#43585D]">
              Published notes appear at the top of the public Research section alongside baseline
              briefs.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0B5563] neu-raised-sm rounded-xl shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>New</span>
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-[#43585D] py-4">Loading research notes...</p>
        ) : notes.length === 0 ? (
          <div className="neu-pressed rounded-2xl p-4 text-xs text-[#43585D] leading-relaxed">
            No custom research notes saved in SQLite yet. The four curated baseline briefs remain
            visible on the site, or you can publish a new note here.
          </div>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {notes.map((note) => {
              const active = editingId === note.id;
              return (
                <div
                  key={note.id}
                  className={`rounded-2xl p-4 transition-all ${
                    active ? 'neu-raised-sm ring-1 ring-[#0B5563]/30' : 'neu-pressed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => selectForEdit(note)}
                      className="text-left min-w-0 flex-1 cursor-pointer"
                    >
                      <p className="text-[11px] font-medium text-[#0B5563]">
                        {note.category} · {note.published ? 'Published' : 'Draft'}
                      </p>
                      <p className="text-sm font-semibold text-[#0B2228] truncate mt-0.5">
                        {note.title}
                      </p>
                      <p className="text-xs text-[#43585D] line-clamp-2 mt-1">{note.summary}</p>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${note.title}`}
                      onClick={() => void handleDelete(note.id)}
                      className="p-1.5 text-[#7E9094] hover:text-[#9A3412] shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="lg:col-span-7 neu-pressed rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-base font-semibold text-[#0B2228]">
            {editingId ? 'Edit Research Note' : 'Publish New Research Note'}
          </h4>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0B2228] cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, published: e.target.checked }));
                setSavedNotice(false);
              }}
              className="accent-[#0B5563]"
            />
            <span>Published on public site</span>
          </label>
        </div>

        <div>
          <label htmlFor="res-title" className="block text-xs font-semibold text-[#0B2228] mb-1">
            Title
          </label>
          <input
            id="res-title"
            type="text"
            required
            maxLength={140}
            value={form.title}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, title: e.target.value }));
              setSavedNotice(false);
            }}
            placeholder="e.g., 05. Claims Reconciliation Workflows in East African Healthcare"
            className="w-full px-3.5 py-2 text-sm bg-white/80 rounded-xl text-[#0B2228] placeholder:text-[#7E9094] focus:outline-2 focus:outline-[#0B5563]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="res-category" className="block text-xs font-semibold text-[#0B2228] mb-1">
              Topic
            </label>
            <select
              id="res-category"
              value={form.category}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, category: e.target.value as ResearchCategory }));
                setSavedNotice(false);
              }}
              className="w-full px-3 py-2 text-xs font-medium bg-white/80 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
            >
              {RESEARCH_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="res-label" className="block text-xs font-semibold text-[#0B2228] mb-1">
              Edition / Date Label
            </label>
            <input
              id="res-label"
              type="text"
              maxLength={40}
              value={form.publishedLabel}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, publishedLabel: e.target.value }));
                setSavedNotice(false);
              }}
              placeholder="Field Brief · 2026"
              className="w-full px-3 py-2 text-xs bg-white/80 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
            />
          </div>

          <div>
            <label htmlFor="res-read" className="block text-xs font-semibold text-[#0B2228] mb-1">
              Read Time
            </label>
            <input
              id="res-read"
              type="text"
              maxLength={24}
              value={form.readTime}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, readTime: e.target.value }));
                setSavedNotice(false);
              }}
              placeholder="4 min read"
              className="w-full px-3 py-2 text-xs bg-white/80 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="res-sectors" className="block text-xs font-semibold text-[#0B2228] mb-1">
            Sectors Examined (optional)
          </label>
          <input
            id="res-sectors"
            type="text"
            maxLength={140}
            value={form.sectors}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, sectors: e.target.value }));
              setSavedNotice(false);
            }}
            placeholder="Financial services, logistics, healthcare"
            className="w-full px-3.5 py-2 text-xs bg-white/80 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
          />
        </div>

        <div>
          <label htmlFor="res-summary" className="block text-xs font-semibold text-[#0B2228] mb-1">
            Summary
          </label>
          <textarea
            id="res-summary"
            rows={2}
            required
            maxLength={360}
            value={form.summary}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, summary: e.target.value }));
              setSavedNotice(false);
            }}
            placeholder="Concise two-sentence abstract shown on the Research card..."
            className="w-full px-3.5 py-2 text-sm bg-white/80 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563] resize-none"
          />
        </div>

        <div>
          <label htmlFor="res-findings" className="block text-xs font-semibold text-[#0B2228] mb-1">
            Key Takeaways (one per line, optional)
          </label>
          <textarea
            id="res-findings"
            rows={3}
            value={findingsText}
            onChange={(e) => {
              setFindingsText(e.target.value);
              setSavedNotice(false);
            }}
            placeholder="Finding 1&#10;Finding 2"
            className="w-full px-3.5 py-2 text-xs bg-white/80 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563] resize-none"
          />
        </div>

        <div>
          <label htmlFor="res-body" className="block text-xs font-semibold text-[#0B2228] mb-1">
            Full Research Note (separate paragraphs with blank lines)
          </label>
          <textarea
            id="res-body"
            rows={5}
            required
            maxLength={6000}
            value={form.body}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, body: e.target.value }));
              setSavedNotice(false);
            }}
            placeholder="Write the full research note..."
            className="w-full px-3.5 py-2 text-sm bg-white/80 rounded-xl text-[#0B2228] focus:outline-2 focus:outline-[#0B5563]"
          />
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium text-[#9A3412]">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          {savedNotice ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0B5563]">
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              Saved to SQLite
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-xs font-semibold text-white neu-btn-teal rounded-xl disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving...' : editingId ? 'Update Research Note' : 'Publish Research Note'}
          </button>
        </div>
      </form>
    </div>
  );
}
