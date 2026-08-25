import type { ChecklistTemplateAggregate } from "@/domain/checklists";
import { supabaseServerFetch } from "@/lib/database/verified-request";

type TemplateRow = { id:string;name:string;description:string|null;version:number;active:boolean;created_at:string;updated_at:string };
type SectionRow = { id:string;template_id:string;name:string;description:string|null;active:boolean;sort_order:number };
type ItemRow = { id:string;section_id:string;name:string;description:string|null;required:boolean;active:boolean;sort_order:number };

export async function fetchChecklistTemplates(): Promise<ChecklistTemplateAggregate[]> {
  const [templatesResponse, sectionsResponse, itemsResponse] = await Promise.all([
    supabaseServerFetch("checklist_templates?select=id,name,description,version,active,created_at,updated_at&order=updated_at.desc"),
    supabaseServerFetch("checklist_sections?select=id,template_id,name,description,active,sort_order&order=sort_order.asc"),
    supabaseServerFetch("checklist_items?select=id,section_id,name,description,required,active,sort_order&order=sort_order.asc"),
  ]);
  if (![templatesResponse, sectionsResponse, itemsResponse].every((response) => response.ok)) throw new Error("No se pudieron consultar los checklists.");
  const templates = await templatesResponse.json() as TemplateRow[], sections = await sectionsResponse.json() as SectionRow[], items = await itemsResponse.json() as ItemRow[];
  return templates.map((template) => ({ id: template.id, name: template.name, description: template.description ?? undefined, version: template.version, active: template.active, createdAt: template.created_at, updatedAt: template.updated_at, sections: sections.filter((section) => section.template_id === template.id).map((section) => ({ id: section.id, templateId: section.template_id, name: section.name, description: section.description ?? undefined, active: section.active, order: section.sort_order, items: items.filter((item) => item.section_id === section.id).map((item) => ({ id: item.id, sectionId: item.section_id, name: item.name, description: item.description ?? undefined, required: item.required, active: item.active, order: item.sort_order })) })) }));
}
