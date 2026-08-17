import { getServerSessionUser } from "@/lib/auth/server-session";
import { supabaseServerFetch, supabaseStorageFetch } from "@/lib/database/verified-request";

export const runtime = "nodejs";
type Context = { params: Promise<{ visitId:string; photoId:string }> };

export async function GET(_: Request, { params }: Context) {
  const user = await getServerSessionUser();
  if (!user || user.role === "ADMIN") return new Response(null, { status: 403 });
  const { visitId, photoId } = await params;
  const visitResponse = await supabaseServerFetch(`visits?select=id,supervisor_id&id=eq.${visitId}&limit=1`);
  const [visit] = visitResponse.ok ? await visitResponse.json() as { id:string; supervisor_id:string }[] : [];
  if (!visit || visit.supervisor_id !== user.id) return new Response(null, { status: 403 });
  const inspectionResponse = await supabaseServerFetch(`inspections?select=id&visit_id=eq.${visitId}&limit=1`);
  const [inspection] = inspectionResponse.ok ? await inspectionResponse.json() as { id:string }[] : [];
  if (!inspection) return new Response(null, { status: 404 });
  const photoResponse = await supabaseServerFetch(`inspection_photos?select=storage_key,mime_type&inspection_id=eq.${inspection.id}&id=eq.${photoId}&deleted_at=is.null&limit=1`);
  const [photo] = photoResponse.ok ? await photoResponse.json() as { storage_key:string; mime_type:string|null }[] : [];
  if (!photo) return new Response(null, { status: 404 });
  const file = await supabaseStorageFetch(`object/inspection-photos/${photo.storage_key}`);
  if (!file.ok) return new Response(null, { status: 404 });
  return new Response(file.body, { headers: { "content-type": photo.mime_type ?? "image/jpeg", "cache-control": "private, max-age=300" } });
}
