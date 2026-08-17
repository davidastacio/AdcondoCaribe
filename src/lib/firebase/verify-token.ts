export async function verifyFirebaseIdToken(idToken: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("Firebase no está configurado.");

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("Token de Firebase inválido.");

  const payload = (await response.json()) as { users?: Array<{ localId: string }> };
  const uid = payload.users?.[0]?.localId;
  if (!uid) throw new Error("Firebase no devolvió una identidad.");
  return { uid };
}
