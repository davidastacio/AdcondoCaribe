-- PROPOSAL ONLY. DO NOT EXECUTE WITHOUT APPROVAL.
-- Idempotent configuration only; no users, towers, visits or operational mock data.
insert into public.catalog_items(catalog_type,code,label,sort_order) values
 ('UNIT','UNIT','Unidad',10), ('UNIT','BOX','Caja',20), ('UNIT','ROLL','Rollo',30),
 ('VISIT_TYPE','ROUTINE','Rutina',10), ('VISIT_TYPE','FOLLOW_UP','Seguimiento',20), ('VISIT_TYPE','EMERGENCY','Emergencia',30),
 ('INCIDENT_AREA','COMMON_AREAS','Áreas comunes',10), ('INCIDENT_AREA','ELECTRICAL','Eléctrica',20), ('INCIDENT_AREA','PLUMBING','Plomería',30),
 ('INCIDENT_CATEGORY','GENERAL','General',10),
 ('INVENTORY_CATEGORY','GENERAL','General',10),
 ('DOCUMENT_CATEGORY','REGULATION','Reglamento',10), ('DOCUMENT_CATEGORY','MANUAL','Manual',20), ('DOCUMENT_CATEGORY','CONTRACT','Contrato',30)
on conflict(catalog_type,code) do update set label=excluded.label, sort_order=excluded.sort_order;
