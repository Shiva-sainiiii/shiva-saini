"use client";
import { useEffect, useState } from "react";
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Review = { id: string; name: string; stars: number; message: string };
const input = "w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-white/50";

const Stars = ({ n }: { n: number }) => (
  <span aria-label={`${n} out of 5`}>
    {"★".repeat(n)}<span className="text-white/20">{"★".repeat(5 - n)}</span>
  </span>
);

// Feedback: Firebase Firestore, realtime. Rules: firestore.rules
export default function Feedback() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stars, setStars] = useState(5);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"), limit(12));
    return onSnapshot(q, (snap) => setReviews(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) }))));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !message.trim()) return;
    setStatus("sending");
    try {
      await addDoc(collection(db, "feedback"), {
        name: name.trim().slice(0, 60) || "Anonymous", stars, message: message.trim().slice(0, 500), createdAt: serverTimestamp(),
      });
      setName(""); setMessage(""); setStatus("done");
    } catch { setStatus("error"); }
  };

  const avg = reviews.length ? (reviews.reduce((a, r) => a + r.stars, 0) / reviews.length).toFixed(1) : null;

  return (
    <div>
      {avg && <p className="mb-8 text-5xl font-light md:text-7xl">{avg}<span className="ml-3 text-xl text-white/40">from {reviews.length} reviews</span></p>}

      <form onSubmit={submit} className="space-y-4">
        <div role="radiogroup" aria-label="Rating" className="flex gap-1 text-3xl" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} stars`}
              onClick={() => setStars(n)} onMouseEnter={() => setHover(n)}
              className={n <= (hover || stars) ? "text-white" : "text-white/20"}>★</button>
          ))}
        </div>
        <input className={input} placeholder="Your name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        <textarea className={input} placeholder="Your feedback" rows={3} maxLength={500} required value={message} onChange={(e) => setMessage(e.target.value)} />
        <button disabled={status === "sending"} className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black disabled:opacity-50">
          {status === "sending" ? "Sending…" : "Send feedback"}
        </button>
        {status === "done" && <p className="text-sm text-white/60">Thanks for the feedback.</p>}
        {status === "error" && <p className="text-sm text-red-400">Could not send. Please try again.</p>}
      </form>

      <ul className="mt-12 space-y-6">
        {reviews.map((r) => (
          <li key={r.id} className="border-t border-white/10 pt-6">
            <Stars n={r.stars} />
            <p className="mt-2 text-white/80">{r.message}</p>
            <p className="mt-1 text-sm text-white/40">{r.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
