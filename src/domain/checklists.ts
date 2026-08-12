export interface ChecklistTemplate { id: string; name: string; description?: string; active: boolean; version: number; createdAt: string; updatedAt: string }
export interface ChecklistSection { id: string; templateId: string; name: string; description?: string; active: boolean; order: number }
export interface ChecklistItem { id: string; sectionId: string; name: string; description?: string; required: boolean; active: boolean; order: number }
export interface ChecklistTemplateAggregate extends ChecklistTemplate { sections: Array<ChecklistSection & { items: ChecklistItem[] }> }
