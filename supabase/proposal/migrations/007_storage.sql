-- PROPOSAL ONLY. DO NOT EXECUTE WITHOUT APPROVAL.
-- Approved MVP limits. All buckets are private.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('inspection-photos','inspection-photos',false,10485760,array['image/jpeg','image/png','image/webp']),
 ('incident-photos','incident-photos',false,10485760,array['image/jpeg','image/png','image/webp']),
 ('inventory-photos','inventory-photos',false,10485760,array['image/jpeg','image/png','image/webp']),
 ('documents','documents',false,26214400,array['application/pdf','image/jpeg','image/png']),
 ('avatars','avatars',false,5242880,array['image/jpeg','image/png','image/webp']);

-- Direct browser upload remains disabled until Firebase tokens are proven at the Storage gateway.
-- Initial production path: verified backend validates authorization, MIME, extension, size and canonical path,
-- then performs the Storage operation with server credentials and records the database row/audit atomically where possible.
-- Images must be decoded and re-encoded server-side to remove EXIF before upload. Latitude/longitude are
-- accepted only as separately validated application fields. DOCX/XLSX and physical deletion remain disabled.
-- No permissive storage.objects policy is intentionally included in this migration.
