"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Field = { key: string; label: string; type?: "text" | "textarea" | "image" };
type Row = Record<string, any> & { id: string };

const input = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/50";

// Generic CRUD: koi bhi table + fields do, add / edit / delete / reorder / image upload sab milta hai.
export default function CollectionEditor({ table, fields, readOnly = false }: { table: string; fields: Field[]; readOnly?: boolean }) {
  const db = supabase!;
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const q = db.from(table).select("*");
    const { data, error } = readOnly ? await q.order("created_at", { ascending: false }) : await q.order("position").order("created_at");
    setMsg(error?.message ?? "");
    setRows((data ?? []) as Row[]);
  }, [db, table, readOnly]);

  useEffect(() => { setDraft({}); setEditing(null); load(); }, [load]);

  const upload = async (key: string, file: File) => {
    setBusy(true);
    const path = `${table}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await db.storage.from("portfolio").upload(path, file);
    if (error) setMsg(error.message);
    else setDraft((d) => ({ ...d, [key]: db.storage.from("portfolio").getPublicUrl(path).data.publicUrl }));
    setBusy(false);
  };

  const save = async () => {
    setBusy(true);
    const { error } = editing ? await db.from(table).update(draft).eq("id", editing) : await db.from(table).insert({ ...draft, position: rows.length });
    setBusy(false);
    if (error) return setMsg(error.message);
    setDraft({}); setEditing(null); setMsg("Saved ✓"); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await db.from(table).delete().eq("id", id);
    setMsg(error?.message ?? ""); load();
  };

  // Swap karke poori list ko 0..n position dobara de dete hain (gaps se bachne ke liye)
  const move = async (i: number, dir: number) => {
    const next = [...rows];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    await Promise.all(next.map((r, idx) => db.from(table).update({ position: idx }).eq("id", r.id)));
    load();
  };

  const edit = (r: Row) => { setEditing(r.id); setDraft(Object.fromEntries(fields.map((f) => [f.key, r[f.key] ?? ""]))); };

  return (
    <div>
      {!readOnly && (
        <div className="space-y-3 rounded-xl border border-white/10 p-4">
          {fields.map((f) => (
            <label key={f.key} className="block text-xs text-white/50">
              {f.label}
              {f.type === "textarea" ? (
                <textarea className={`${input} mt-1`} rows={3} value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
              ) : f.type === "image" ? (
                <div className="mt-1 flex items-center gap-3">
                  {draft[f.key] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={draft[f.key]} alt="" className="h-12 w-20 rounded object-cover" />}
                  <input type="file" accept="image/*" className="text-sm" onChange={(e) => e.target.files?.[0] && upload(f.key, e.target.files[0])} />
                </div>
              ) : (
                <input className={`${input} mt-1`} value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
              )}
            </label>
          ))}
          <div className="flex gap-3">
            <button onClick={save} disabled={busy} className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black disabled:opacity-50">
              {editing ? "Update" : "Add"}
            </button>
            {editing && <button onClick={() => { setEditing(null); setDraft({}); }} className="text-sm text-white/50">Cancel</button>}
          </div>
        </div>
      )}
      {msg && <p className="mt-3 text-sm text-white/60">{msg}</p>}

      <ul className="mt-6 divide-y divide-white/10">
        {rows.map((r, i) => (
          <li key={r.id} className="flex items-start justify-between gap-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{String(r[fields[0].key] ?? "")}</p>
              {readOnly && <p className="mt-1 whitespace-pre-wrap text-white/50">{r.email}: {r.message}</p>}
            </div>
            <div className="flex shrink-0 gap-3 text-white/50">
              {!readOnly && (
                <>
                  <button disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                  <button disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                  <button onClick={() => edit(r)} className="hover:text-white">Edit</button>
                </>
              )}
              <button onClick={() => remove(r.id)} className="hover:text-red-400">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
