import { getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export function getFirebaseAdminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID no está configurado.");

  const app = getApps().length ? getApp() : initializeApp({ projectId });
  return getAuth(app);
}

