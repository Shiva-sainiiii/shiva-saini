import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Service account (server-only!). Do tareeke:
//  1) FIREBASE_SERVICE_ACCOUNT = downloaded JSON file ka poora content (sabse aasaan)
//  2) FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (+ NEXT_PUBLIC_FIREBASE_PROJECT_ID)
function credentials() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    let j: { project_id?: string; client_email?: string; private_key?: string };
    try { j = JSON.parse(raw); } catch { throw new Error("FIREBASE_SERVICE_ACCOUNT valid JSON nahi hai — poori JSON file ka content paste karo."); }
    if (j.project_id && j.client_email && j.private_key)
      return { projectId: j.project_id, clientEmail: j.client_email, privateKey: j.private_key.replace(/\\n/g, "\n") };
    throw new Error("FIREBASE_SERVICE_ACCOUNT me project_id / client_email / private_key missing hai.");
  }
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) return { projectId, clientEmail, privateKey };
  throw new Error("Firebase service account Vercel env me set nahi hai (FIREBASE_SERVICE_ACCOUNT).");
}

export function getAdminDb() {
  const app: App = getApps().length ? getApps()[0] : initializeApp({ credential: cert(credentials()) });
  return getFirestore(app);
}
