import type { ChecklistTemplateAggregate } from "@/domain/checklists";
import { checklistSections } from "@/features/visits/mock-data";

export const seedChecklistTemplates: ChecklistTemplateAggregate[] = [{
  id: "checklist-general-v1", name: "Supervisión General de Torre", description: "Plantilla base para recorridos residenciales.", active: true, version: 1, createdAt: "2026-01-01T09:00:00", updatedAt: "2026-08-01T09:00:00",
  sections: checklistSections.map((section, sectionIndex) => ({
    id: section.id, templateId: "checklist-general-v1", name: section.title, active: true, order: sectionIndex,
    items: section.items.map((item, itemIndex) => ({ id: item.id, sectionId: section.id, name: item.title, description: item.instructions, required: item.required ?? false, active: true, order: itemIndex })),
  })),
}];
