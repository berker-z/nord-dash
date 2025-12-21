import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface NoteFile {
  id: string;
  name: string;
  content: string;
  updatedAt: number;
}

const notesCol = (userEmail: string) =>
  collection(db, "users", userEmail, "notes");

export const listNotes = async (userEmail: string): Promise<NoteFile[]> => {
  const q = query(notesCol(userEmail), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name || "Untitled",
      content: data.content || "",
      updatedAt: data.updatedAt?.toMillis
        ? data.updatedAt.toMillis()
        : data.updatedAt || Date.now(),
    };
  });
};

export const getNote = async (
  userEmail: string,
  noteId: string
): Promise<NoteFile | null> => {
  const ref = doc(db, "users", userEmail, "notes", noteId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name || "Untitled",
    content: data.content || "",
    updatedAt: data.updatedAt?.toMillis
      ? data.updatedAt.toMillis()
      : data.updatedAt || Date.now(),
  };
};

export const createNote = async (
  userEmail: string,
  name: string
): Promise<NoteFile> => {
  const docRef = await addDoc(notesCol(userEmail), {
    name,
    content: "",
    updatedAt: Timestamp.now(),
  });
  return {
    id: docRef.id,
    name,
    content: "",
    updatedAt: Date.now(),
  };
};

export const saveNote = async (
  userEmail: string,
  note: NoteFile
): Promise<void> => {
  const ref = doc(db, "users", userEmail, "notes", note.id);
  await setDoc(
    ref,
    {
      name: note.name,
      content: note.content,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
};

export const deleteNote = async (
  userEmail: string,
  noteId: string
): Promise<void> => {
  const ref = doc(db, "users", userEmail, "notes", noteId);
  await deleteDoc(ref);
};
