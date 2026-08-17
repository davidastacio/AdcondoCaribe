export type DatabaseUserRow = {
  id: string;
  firebase_uid: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_storage_key: string | null;
  job_title: string | null;
  role: "ADMIN" | "SUPERVISOR";
  status: "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED";
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

function getServerConfig() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("La conexión privada de Supabase no está configurada.");
  }
  return { url: url.replace(/\/$/, ""), secretKey };
}

export async function findVerifiedAppUser(firebaseUid: string) {
  const { url, secretKey } = getServerConfig();
  const params = new URLSearchParams({
    select:
      "id,firebase_uid,email,first_name,last_name,phone,avatar_storage_key,job_title,role,status,last_login_at,created_at,updated_at",
    firebase_uid: `eq.${firebaseUid}`,
    limit: "1",
  });
  const response = await fetch(`${url}/rest/v1/users?${params}`, {
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Supabase rechazó la consulta de identidad.");
  const rows = (await response.json()) as DatabaseUserRow[];
  return rows[0] ?? null;
}
