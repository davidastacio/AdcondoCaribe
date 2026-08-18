insert into public.catalog_items(catalog_type,code,label,sort_order) values
('INVENTORY_CATEGORY','CLEANING','Limpieza',10),
('INVENTORY_CATEGORY','HYGIENE','Higiene',20),
('INVENTORY_CATEGORY','POOL','Piscina',30),
('INVENTORY_CATEGORY','ELECTRICITY','Electricidad',40),
('INVENTORY_CATEGORY','MAINTENANCE','Mantenimiento',50),
('INVENTORY_CATEGORY','OTHER','Otros',999),
('UNIT','PACKAGE','Paquete',40),('UNIT','GALLON','Galón',50),('UNIT','LITER','Litro',60),
('UNIT','BAG','Bolsa',70),('UNIT','BOTTLE','Botella',80)
on conflict(catalog_type,code) do update set label=excluded.label,sort_order=excluded.sort_order,active=true;

with materials(name,category_code,unit_code) as (values
('Jabón de manos','HYGIENE','BOTTLE'),('Papel higiénico','HYGIENE','ROLL'),
('Papel toalla','HYGIENE','ROLL'),('Fundas de basura','CLEANING','PACKAGE'),
('Cloro','CLEANING','GALLON'),('Desinfectante','CLEANING','GALLON'),
('Ambientador','CLEANING','BOTTLE'),('Guantes','CLEANING','BOX'),
('Suapes / mapos','CLEANING','UNIT'),('Escobas','CLEANING','UNIT'),
('Químicos de piscina','POOL','GALLON'),('Bombillos LED','ELECTRICITY','UNIT'),
('Material eléctrico','ELECTRICITY','BOX'),('Pintura','MAINTENANCE','GALLON'),
('Otros materiales','OTHER','UNIT')
)
insert into public.inventory_items(name,category_id,unit_id,active)
select m.name,c.id,u.id,true from materials m
join public.catalog_items c on c.catalog_type='INVENTORY_CATEGORY' and c.code=m.category_code
join public.catalog_items u on u.catalog_type='UNIT' and u.code=m.unit_code
where not exists(select 1 from public.inventory_items i where lower(i.name)=lower(m.name));
