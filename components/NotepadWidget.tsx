import React, { useEffect, useRef, useState, useCallback } from "react";
import { FilePlus, Save, FolderOpen, Trash2 } from "lucide-react";
import { ModalFrame } from "./ui/ModalFrame";
import {
  createNote,
  getNote,
  listNotes,
  NoteFile,
  saveNote,
  deleteNote,
} from "../services/notepadService";

type SaveState = "saved" | "dirty" | "saving";

interface NotepadWidgetProps {
  userEmail?: string | null;
}

const SNIPPET_LENGTH = 20;

export const NotepadWidget: React.FC<NotepadWidgetProps> = ({ userEmail }) => {
  const [notes, setNotes] = useState<NoteFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isAuthed = Boolean(userEmail);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  const hydrate = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const existing = await listNotes(userEmail);
      if (existing.length === 0) {
        const first = await createNote(userEmail, "");
        setNotes([first]);
        setActiveId(first.id);
        setContent(first.content);
        setSaveState("saved");
        return;
      }
      setNotes(existing);
      setActiveId(existing[0].id);
      setContent(existing[0].content);
      setSaveState("saved");
    } catch (e) {
      console.error("Failed to load notes", e);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) {
      setNotes([]);
      setActiveId(null);
      setContent("");
      setSaveState("saved");
      return;
    }
    hydrate();
  }, [userEmail, hydrate]);

  const activeNote = notes.find((n) => n.id === activeId) || null;

  const persistActiveIfDirty = useCallback(async () => {
    if (!userEmail || !activeNote) return;
    if (saveState !== "dirty") return;
    setSaveState("saving");
    try {
      const updated: NoteFile = {
        ...activeNote,
        content,
        updatedAt: Date.now(),
      };
      await saveNote(userEmail, updated);
      const nextNotes = notes.map((n) => (n.id === updated.id ? updated : n));
      nextNotes.sort((a, b) => b.updatedAt - a.updatedAt);
      setNotes(nextNotes);
      setActiveId(updated.id);
      setSaveState("saved");
    } catch (e) {
      console.error("Failed to auto-save current note", e);
      setSaveState("dirty");
      throw e;
    }
  }, [userEmail, activeNote, saveState, content, notes]);

  const handleNew = async () => {
    if (!userEmail) return;
    await persistActiveIfDirty().catch(() => {});
    const nextIndex = notes.length + 1;
    try {
      const fresh = await createNote(userEmail, "");
      setNotes([fresh, ...notes]);
      setActiveId(fresh.id);
      setContent("");
      setSaveState("dirty");
    } catch (e) {
      console.error("Failed to create note", e);
    }
  };

  const handleSave = async () => {
    if (!userEmail || !activeNote) return;
    setSaveState("saving");
    try {
      const updated: NoteFile = {
        ...activeNote,
        content,
        updatedAt: Date.now(),
      };
      await saveNote(userEmail, updated);
      const nextNotes = notes.map((n) => (n.id === updated.id ? updated : n));
      // Sort by updatedAt desc to keep newest on top
      nextNotes.sort((a, b) => b.updatedAt - a.updatedAt);
      setNotes(nextNotes);
      setActiveId(updated.id);
      setSaveState("saved");
    } catch (e) {
      console.error("Failed to save note", e);
      setSaveState("dirty");
    }
  };

  const handleSelect = async (id: string) => {
    if (!userEmail) return;
    await persistActiveIfDirty().catch(() => {});
    try {
      const selected = await getNote(userEmail, id);
      if (!selected) return;
      setActiveId(selected.id);
      setContent(selected.content);
      setSaveState("saved");
      setPickerOpen(false);
    } catch (e) {
      console.error("Failed to load note", e);
    }
  };

  const formatSnippet = (note: NoteFile) => {
    const trimmed = (note.content || "").trim();
    if (!trimmed) return "[empty]";
    if (trimmed.length <= SNIPPET_LENGTH) return trimmed;
    return `${trimmed.slice(0, SNIPPET_LENGTH)}…`;
  };

  const handleDelete = async (id: string) => {
    if (!userEmail) return;
    const confirmed = window.confirm("Delete this note? This cannot be undone.");
    if (!confirmed) return;
    try {
      await deleteNote(userEmail, id);
      const remaining = notes.filter((n) => n.id !== id);
      setNotes(remaining);

      if (id === activeId) {
        if (remaining.length > 0) {
          const next = remaining[0];
          setActiveId(next.id);
          setContent(next.content);
          setSaveState("saved");
        } else {
          const fresh = await createNote(userEmail, "");
          setNotes([fresh]);
          setActiveId(fresh.id);
          setContent(fresh.content);
          setSaveState("saved");
        }
      }
    } catch (e) {
      console.error("Failed to delete note", e);
    }
  };

  const saveIconColor =
    saveState === "dirty"
      ? "text-nord-13"
      : saveState === "saving"
        ? "text-nord-9"
        : "text-nord-14";

  if (!isAuthed) {
    return (
      <div className="flex flex-col font-mono items-center justify-center h-48 text-nord-3 text-center">
        <p>Please log in to use the notepad.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col font-mono items-center justify-center h-48 text-nord-3 text-center">
        <div className="w-8 h-8 border-2 border-nord-8 border-t-transparent rounded-full animate-spin mb-3" />
        <p>Loading notes…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 font-mono text-nord-4">
      <div className="flex items-center gap-3">
        <div className="text-muted-sm uppercase tracking-[0.12em]">
          Notepad
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleNew}
            className="p-2 rounded-lg border-2 border-nord-3 bg-nord-1 hover:border-nord-9 hover:text-nord-9 transition-colors"
            title="New note"
          >
            <FilePlus size={18} />
          </button>
          <button
            onClick={() => setPickerOpen(true)}
            className="p-2 rounded-lg border-2 border-nord-3 bg-nord-1 hover:border-nord-9 hover:text-nord-9 transition-colors"
            title="Load note"
          >
            <FolderOpen size={18} />
          </button>
          <button
            onClick={handleSave}
            className={`p-2 rounded-lg border-2 border-nord-3 bg-nord-1 hover:border-nord-9 transition-colors ${saveIconColor}`}
            title="Save"
          >
            <Save size={18} />
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setSaveState("dirty");
        }}
        onInput={adjustHeight}
        placeholder="Write here..."
        className="w-full bg-nord-1 border-2 border-nord-3 rounded-lg px-4 py-3 focus:outline-none focus:border-nord-9 text-nord-4 placeholder-nord-3 leading-relaxed resize-none"
        style={{ minHeight: "10.5rem" }}
      />

      {pickerOpen && (
        <ModalFrame
          title="/notepad/load"
          onClose={() => setPickerOpen(false)}
          size="sm"
        >
          <div className="flex flex-col gap-2">
            {notes.length === 0 && (
              <div className="text-muted-sm text-center py-4">
                No notes yet.
              </div>
            )}
            {notes.map((note, idx) => (
              <div
                key={note.id}
                className={`group flex items-center gap-3 px-3 py-2 border-b ${
                  idx === notes.length - 1 ? "border-transparent" : "border-nord-1"
                } ${note.id === activeId ? "bg-nord-1/60" : "hover:bg-nord-1"}`}
              >
                <button
                  onClick={() => handleSelect(note.id)}
                  className="flex-1 text-left"
                >
                  <div
                    className={`text-sm ${
                      note.id === activeId ? "text-nord-9" : "text-nord-4"
                    }`}
                  >
                    {formatSnippet(note)}
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="opacity-70 group-hover:opacity-100 text-nord-11 hover:bg-nord-2 p-2 rounded transition-all"
                  title="Delete note"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </ModalFrame>
      )}
    </div>
  );
};
