"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { shrinkImage } from "@/lib/image";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "image" | "select";
  options?: readonly string[]; // type: "select" ke liye
  placeholder?: string;
};
type Row = Record<string, any> & { id: string };

const BUCKET = "portfolio";
const input = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/50";

// Public URL se storage path nikalta hai — sirf apne bucket ki files hi delete hongi
const storagePath = (url?: string | null) => {
  const m = url?.match(new RegExp(`/storage/v1/object/public/${BUCKET}/(.+)$`));
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return m[1]; }
};

// Generic CRUD: koi bhi table + fields do, add / edit / delete / reorder / image upload sab milta hai.
// subtitle = list me title ke neeche kaunsi fields dikhani hain (jaise project ka tag + skills).
export default function CollectionEditor({ table, fields, subtitle = [], readOnly = false }: { table: string; fields: Field[]; subtitle?: string[]; readOnly?: boolean }) {
  const db = supabase!;
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const q = db.from(table).select("*");
    const { data, error } = readOnly ? await q.order("created_at", { ascending: false }) : await q.order("position").order("created_at");
    if (error) setMsg(error.message);
    setRows((data ?? []) as Row[]);
  }, [db, table, readOnly]);

  useEffect(() => { setDraft({}); setEditing(null); setMsg(""); load(); }, [load]);

  const imageField = fields.find((f) => f.type === "image");
  const titleOf = (r: Row) => String(r[fields[0].key] ?? "");
  const removeFile = (url?: string | null) => { const p = storagePath(url); if (p) void db.storage.from(BUCKET).remove([p]); };
  // Column/table na mile to user ko seedha batao kya karna hai
  const explain = (m: string) => (/schema cache|does not exist|relation .* not found/i.test(m) ? `${m} — supabase/migration-002-admin.sql run kiya?` : m);

  const upload = async (key: string, file: File) => {
    setBusy(true); setMsg("Uploading…");
    const { blob, ext } = await shrinkImage(file);
    const base = file.name.replace(/\.[^.]+$/, "").replace(/[^\w-]/g, "_").slice(0, 40) || "image";
    const path = `${table}/${Date.now()}-${base}.${ext.replace(/[^a-z0-9]/g, "") || "jpg"}`;
    const { error } = await db.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || undefined, cacheControl: "31536000" });
    if (error) setMsg(error.message);
    else {
      setDraft((d) => ({ ...d, [key]: db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl }));
      setMsg(`Image uploaded ✓ (${Math.max(1, Math.round(blob.size / 1024))} KB) — ab Add/Update dabao`);
    }
    setBusy(false);
  };

  const reset = () => { setDraft({}); setEditing(null); };

  const save = async () => {
    if (!draft[fields[0].key]?.trim()) return setMsg(`${fields[0].label} zaroori hai.`);
    setBusy(true);
    const payload = Object.fromEntries(fields.map((f) => [f.key, (draft[f.key] ?? "").trim()]));
    const old = editing ? rows.find((r) => r.id === editing) : undefined;
    // .select("id") isliye: RLS ki wajah se 0 rows update hon to error nahi aata — hum khud pakad lete hain
    const res = editing
      ? await db.from(table).update(payload).eq("id", editing).select("id")
      : await db.from(table).insert({ ...payload, position: rows.length }).select("id");
    setBusy(false);
    if (res.error) return setMsg(explain(res.error.message));
    if (!res.data?.length) return setMsg("Save nahi hua — admin email se login ho? (RLS ne block kiya)");
    // Image badli to purani storage se hata do
    if (old) fields.forEach((f) => f.type === "image" && old[f.key] && old[f.key] !== payload[f.key] && removeFile(old[f.key]));
    reset(); setMsg("Saved ✓"); load();
  };

  const remove = async (r: Row) => {
    if (!confirm(`Delete "${titleOf(r) || "this item"}"?`)) return;
    const { data, error } = await db.from(table).delete().eq("id", r.id).select("id");
    if (error) return setMsg(error.message);
    if (!data?.length) return setMsg("Delete nahi hua — admin email se login ho? (RLS ne block kiya)");
    fields.forEach((f) => f.type === "image" && removeFile(r[f.key]));
    if (editing === r.id) reset();
    setMsg("Deleted ✓"); load();
  };

  // Swap karke poori list ko 0..n position dobara de dete hain (gaps se bachne ke liye)
  const move = async (i: number, dir: number) => {
    const next = [...rows];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setRows(next);
    await Promise.all(next.map((r, idx) => db.from(table).update({ position: idx }).eq("id", r.id)));
    load();
  };

  const edit = (r: Row) => {
    setEditing(r.id);
    setDraft(Object.fromEntries(fields.map((f) => [f.key, r[f.key] ?? ""])));
    setMsg("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); // lambi list me mobile pe form upar hi rehta hai
  };

  return (
    <div>
      {!readOnly && (
        <div ref={formRef} className="scroll-mt-4 space-y-3 rounded-xl border border-white/10 p-4">
          <p className="text-sm font-medium text-white/80">{editing ? `Editing: ${titleOf(rows.find((r) => r.id === editing) ?? ({} as Row))}` : "Add new"}</p>
          {fields.map((f, idx) => (
            <label key={f.key} className="block text-xs text-white/50">
              {f.label}{idx === 0 && " *"}
              {f.type === "textarea" ? (
                <textarea className={`${input} mt-1`} rows={3} placeholder={f.placeholder} value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
              ) : f.type === "select" ? (
                <select className={`${input} mt-1`} value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}>
                  <option value="" className="text-black">— none —</option>
                  {f.options?.map((o) => <option key={o} value={o} className="text-black">{o}</option>)}
                </select>
              ) : f.type === "image" ? (
                <div className="mt-1 flex items-center gap-3">
                  {draft[f.key] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={draft[f.key]} alt="" className="h-14 w-20 rounded object-cover" />}
                  <input type="file" accept="image/*" className="text-sm" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(f.key, file); e.target.value = ""; }} />
                  {draft[f.key] && <button type="button" onClick={() => setDraft({ ...draft, [f.key]: "" })} className="text-white/40 hover:text-red-400">Remove</button>}
                </div>
              ) : (
                <input className={`${input} mt-1`} placeholder={f.placeholder} value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
              )}
            </label>
          ))}
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={busy} className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black disabled:opacity-50">
              {busy ? "Please wait…" : editing ? "Update" : "Add"}
            </button>
            {editing && <button onClick={reset} className="text-sm text-white/50 hover:text-white">Cancel</button>}
          </div>
        </div>
      )}
      {msg && <p className="mt-3 text-sm text-white/60">{msg}</p>}

      {rows.length === 0 && <p className="mt-6 text-sm text-white/40">{readOnly ? "Abhi koi message nahi." : "Abhi kuch add nahi hua. Site tab tak default content dikhayegi."}</p>}
      <ul className="mt-6 divide-y divide-white/10">
        {rows.map((r, i) => {
          const sub = subtitle.map((k) => r[k]).filter(Boolean).join(" · ");
          return (
            <li key={r.id} className="flex items-start justify-between gap-4 py-3 text-sm">
              <div className="flex min-w-0 items-start gap-3">
                {imageField && r[imageField.key] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={r[imageField.key]} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />}
                <div className="min-w-0">
                  <p className="truncate font-medium">{titleOf(r)}</p>
                  {sub && <p className="mt-0.5 truncate text-xs text-white/40">{sub}</p>}
                  {readOnly && (
                    <p className="mt-1 whitespace-pre-wrap break-words text-white/50">
                      {r.email}: {r.message}
                      <span className="mt-1 block text-xs text-white/30">{new Date(r.created_at).toLocaleString()}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-3 text-white/50">
                {!readOnly && (
                  <>
                    <button disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="disabled:opacity-30">↑</button>
                    <button disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down" className="disabled:opacity-30">↓</button>
                    <button onClick={() => edit(r)} className="hover:text-white">Edit</button>
                  </>
                )}
                <button onClick={() => remove(r)} className="hover:text-red-400">Delete</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
