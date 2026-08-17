import { getServerSessionUser } from "@/lib/auth/server-session";
import { supabaseServerFetch, supabaseStorageFetch } from "@/lib/database/verified-request";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const runtime = "nodejs";
type Context = { params: Promise<{ visitId: string }> };
const fields = z.object({ itemId: z.string().uuid(), condition: z.enum(["OPTIMAL","REGULAR","BAD","NOT_APPLICABLE"]) });
const mimeExtensions: Record<string,string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function ownedInspection(visitId: string, userId: string) {
  const visitResponse = await supabaseServerFetch(`visits?select=id,supervisor_id,status&id=eq.${visitId}&limit=1`);
  const [visit] = visitResponse.ok ? await visitResponse.json() as { id:string; supervisor_id:string; status:string }[] : [];
  if (!visit || visit.supervisor_id !== userId || visit.status !== "IN_PROGRESS") return null;
  const inspectionResponse = await supabaseServerFetch(`inspections?select=id,template_snapshot,status&visit_id=eq.${visitId}&limit=1`);
  const [inspection] = inspectionResponse.ok ? await inspectionResponse.json() as { id:string; template_snapshot:{sections:{items:{id:string}[]}[]}; status:string }[] : [];
  return inspection?.status === "IN_PROGRESS" ? inspection : null;
}

export async function POST(request: Request, { params }: Context) {
  const user = await getServerSessionUser();
  if (!user || user.role === "ADMIN") return Response.json({ error: "No autorizado." }, { status: 403 });
  try {
    const { visitId } = await params;
    const inspection = await ownedInspection(visitId, user.id);
    if (!inspection) return Response.json({ error: "La inspección no está disponible." }, { status: 403 });
    const form = await request.formData();
    const input = fields.parse({ itemId: form.get("itemId"), condition: form.get("condition") });
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Selecciona una fotografía." }, { status: 400 });
    const extension = mimeExtensions[file.type];
    if (!extension) return Response.json({ error: "Solo se permiten imágenes JPEG, PNG o WebP." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return Response.json({ error: "La fotografía no puede superar 10 MB." }, { status: 400 });
    const validItem = inspection.template_snapshot.sections.some(section => section.items.some(item => item.id === input.itemId));
    if (!validItem) return Response.json({ error: "Punto de checklist inválido." }, { status: 400 });

    const answerResponse = await supabaseServerFetch("inspection_answers?on_conflict=inspection_id,item_id", { method: "POST", headers: { "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ inspection_id: inspection.id, item_id: input.itemId, condition: input.condition }) });
    const [answer] = answerResponse.ok ? await answerResponse.json() as { id:string }[] : [];
    if (!answer) return Response.json({ error: "No se pudo vincular la fotografía al checklist." }, { status: 502 });

    const storageKey = `${visitId}/${inspection.id}/${answer.id}/${randomUUID()}.${extension}`;
    const uploadResponse = await supabaseStorageFetch(`object/inspection-photos/${storageKey}`, { method: "POST", headers: { "content-type": file.type, "x-upsert": "false" }, body: await file.arrayBuffer() });
    if (!uploadResponse.ok) return Response.json({ error: "No se pudo guardar la fotografía." }, { status: 502 });
    const photoResponse = await supabaseServerFetch("inspection_photos", { method: "POST", headers: { "content-type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ inspection_id: inspection.id, answer_id: answer.id, storage_key: storageKey, mime_type: file.type, uploaded_by_id: user.id }) });
    const [photo] = photoResponse.ok ? await photoResponse.json() as { id:string }[] : [];
    if (!photo) {
      await supabaseStorageFetch(`object/inspection-photos/${storageKey}`, { method: "DELETE" });
      return Response.json({ error: "No se pudo registrar la evidencia." }, { status: 502 });
    }
    return Response.json({ photo: { id: photo.id, url: `/api/supervisor/visits/${visitId}/inspection/photos/${photo.id}` } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Datos de fotografía inválidos." }, { status: 400 });
    return Response.json({ error: "No se pudo procesar la fotografía." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const user = await getServerSessionUser();
  if (!user || user.role === "ADMIN") return Response.json({ error: "No autorizado." }, { status: 403 });
  const { visitId } = await params;
  const inspection = await ownedInspection(visitId, user.id);
  if (!inspection) return Response.json({ error: "La inspección no está disponible." }, { status: 403 });
  const photoId = new URL(request.url).searchParams.get("photoId");
  if (!photoId || !z.string().uuid().safeParse(photoId).success) return Response.json({ error: "Fotografía inválida." }, { status: 400 });
  const photoResponse = await supabaseServerFetch(`inspection_photos?select=id,storage_key&inspection_id=eq.${inspection.id}&id=eq.${photoId}&deleted_at=is.null&limit=1`);
  const [photo] = photoResponse.ok ? await photoResponse.json() as { id:string; storage_key:string }[] : [];
  if (!photo) return Response.json({ error: "Fotografía no encontrada." }, { status: 404 });
  const removed = await supabaseStorageFetch(`object/inspection-photos/${photo.storage_key}`, { method: "DELETE" });
  if (!removed.ok) return Response.json({ error: "No se pudo eliminar el archivo." }, { status: 502 });
  const update = await supabaseServerFetch(`inspection_photos?id=eq.${photo.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ deleted_at: new Date().toISOString(), deleted_by_id: user.id }) });
  return update.ok ? Response.json({ success: true }) : Response.json({ error: "No se pudo actualizar la evidencia." }, { status: 502 });
}
