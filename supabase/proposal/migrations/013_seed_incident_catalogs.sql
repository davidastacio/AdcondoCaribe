insert into public.catalog_items(catalog_type,code,label,sort_order) values
('INCIDENT_AREA','SECURITY_ACCESS','Seguridad y acceso',10),('INCIDENT_AREA','PARKING','Parqueos',20),
('INCIDENT_AREA','HYGIENE_WASTE','Higiene y basura',30),('INCIDENT_AREA','LOBBY','Lobby',40),
('INCIDENT_AREA','HALLWAYS_STAIRS','Pasillos y escaleras',50),('INCIDENT_AREA','ELEVATORS','Ascensores',60),
('INCIDENT_AREA','SOCIAL_AREAS','Áreas sociales',70),('INCIDENT_AREA','POOL_JACUZZI','Piscina / Jacuzzi',80),
('INCIDENT_AREA','GYM','Gimnasio',90),('INCIDENT_AREA','PHYSICAL_MAINTENANCE','Mantenimiento físico',100),
('INCIDENT_AREA','GENERATOR','Planta eléctrica',110),('INCIDENT_AREA','WATER_SYSTEM','Bombas / Sistema de agua',120),
('INCIDENT_AREA','CAMERAS','Cámaras',130),('INCIDENT_AREA','GARDENING','Jardinería',140),
('INCIDENT_AREA','FACADE','Fachada y perímetro',150),('INCIDENT_AREA','ADMINISTRATION','Administración',160),
('INCIDENT_AREA','OTHER','Otro',999)
on conflict(catalog_type,code) do update set label=excluded.label,sort_order=excluded.sort_order,active=true;

insert into public.catalog_items(catalog_type,code,label,sort_order) values
('INCIDENT_CATEGORY','ACCESS_CONTROL','Control de acceso',10),('INCIDENT_CATEGORY','SECURITY','Seguridad',20),
('INCIDENT_CATEGORY','CLEANING','Limpieza e higiene',30),('INCIDENT_CATEGORY','LIGHTING','Iluminación',40),
('INCIDENT_CATEGORY','PLUMBING','Plomería',50),('INCIDENT_CATEGORY','ELECTRICAL','Sistema eléctrico',60),
('INCIDENT_CATEGORY','EQUIPMENT','Equipos y sistemas',70),('INCIDENT_CATEGORY','ELEVATOR','Ascensores',80),
('INCIDENT_CATEGORY','POOL','Piscina y químicos',90),('INCIDENT_CATEGORY','PHYSICAL_DAMAGE','Daño físico',100),
('INCIDENT_CATEGORY','PAINT_HUMIDITY','Pintura y humedad',110),('INCIDENT_CATEGORY','INVENTORY','Materiales e inventario',120),
('INCIDENT_CATEGORY','PERSONNEL','Personal y servicio',130),('INCIDENT_CATEGORY','ADMIN_FOLLOWUP','Seguimiento administrativo',140),
('INCIDENT_CATEGORY','OTHER','Otro',999)
on conflict(catalog_type,code) do update set label=excluded.label,sort_order=excluded.sort_order,active=true;
