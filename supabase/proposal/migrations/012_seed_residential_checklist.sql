do $$
declare
  v_admin uuid;
  v_template uuid;
begin
  select id into v_admin from public.users where role='ADMIN' and status='ACTIVE' order by created_at limit 1;
  if v_admin is null then raise exception 'An active ADMIN is required to seed the checklist'; end if;
  select id into v_template from public.checklist_templates where name='Checklist general de supervisión residencial' and version=1;
  if v_template is null then
    insert into public.checklist_templates(name,description,version,active,created_by_id)
    values('Checklist general de supervisión residencial','Plantilla basada en el checklist operativo ADCONDO para torres residenciales.',1,true,v_admin)
    returning id into v_template;
  end if;

  insert into public.checklist_sections(template_id,name,description,required,active,sort_order)
  values
    (v_template,'Seguridad y acceso','Control de accesos, garita, entrada y parqueos.',true,true,1),
    (v_template,'Higiene y basura','Baños, zafacones, residuos y materiales de limpieza.',true,true,2),
    (v_template,'Áreas comunes','Lobby, pasillos, escaleras y ascensores.',true,true,3),
    (v_template,'Áreas sociales / piscina / gimnasio','Espacios sociales, recreativos y deportivos.',true,true,4),
    (v_template,'Mantenimiento físico','Pintura, pisos, techos, iluminación y herrajes.',true,true,5),
    (v_template,'Equipos y sistemas','Planta, bombas, agua, cámaras y electricidad.',true,true,6),
    (v_template,'Personal','Presentación, puntualidad y servicio.',true,true,7),
    (v_template,'Jardinería / fachada / administración','Entorno exterior y seguimiento administrativo.',true,true,8)
  on conflict(template_id,sort_order) do nothing;

  insert into public.checklist_items(section_id,name,description,required,requires_inventory_check,active,sort_order)
  select s.id,x.name,x.description,true,x.inventory,true,x.item_order
  from public.checklist_sections s
  join (values
    (1,1,'Garita / seguridad','Personal presente; uniforme; actitud; visitantes; acceso; llaves; portones; puertas; cerraduras; cámaras; limpieza y libro de novedades.',false),
    (1,2,'Entrada principal','Puertas y cristales limpios; cerraduras; iluminación; basura; señalización; olor y personas autorizadas.',false),
    (1,3,'Parqueos','Limpieza; estacionamiento; líneas; iluminación; portón; objetos; filtraciones; charcos; rampas y drenajes.',false),
    (2,1,'Baños comunes','Jabón; papeles; zafacón; sanitarios; lavamanos; espejos; llaves; puertas; luces; olor; piso y filtraciones.',true),
    (2,2,'Zafacones por áreas','Fundas; nivel; limpieza; tapas; ubicación; olores y retiro según horario.',true),
    (2,3,'Cuarto / tanques de basura','Tapas; rebose; piso; líquidos; olores; ventilación; desinfección; plagas; acumulación y salida.',false),
    (2,4,'Materiales de limpieza','Existencia física y ubicación de jabones, fundas, papel, cloro, desinfectante, ambientador, escobas, suapes, paños, guantes, químicos, bolsas, cubetas y repuestos.',true),
    (3,1,'Lobby','Piso; cristales; puertas; muebles; decoración; plantas; polvo; olor; ventilación; luces; paredes; pintura; zafacón y recepción.',false),
    (3,2,'Pasillos por piso','Pisos; paredes; pintura; zócalos; luces; olor; emergencias; extintores; señalización; cámaras; objetos; humedad y grietas.',false),
    (3,3,'Escaleras','Escalones; pasamanos; pintura; iluminación; puertas; cerraduras; señalización; bloqueos; basura; humedad y barandas.',false),
    (3,4,'Ascensores','Piso; paredes; acero/cristal; botones; puertas; luces; ventilación; olor; mantenimiento; ruidos; nivelación; espejo y limpieza.',false),
    (4,1,'Salón social','Limpieza; mobiliario; iluminación; ventilación; baños; zafacones; paredes; cristales; decoración; cocina/bar y entrega.',false),
    (4,2,'Piscina / jacuzzi','Agua; cloro/pH; bomba; filtro; drenajes; bordes; piso; duchas; señales; luces; barandas; muebles y cuarto de máquinas.',true),
    (4,3,'Terraza / BBQ','Piso; barandas; cristales; muebles; parrilla; gas; iluminación; zafacones; jardineras; drenajes y normas.',false),
    (4,4,'Gimnasio','Máquinas; cables; pesas; espejos; piso; ventilación; olor; iluminación; zafacón; paños; tomas; normas y piezas.',false),
    (5,1,'Pintura y paredes','Pintura; manchas; golpes; rayones; humedad; moho; grietas; esquinas y retoques.',false),
    (5,2,'Pisos y techos','Roturas; levantamientos; manchas; juntas; charcos; deslizamientos; plafones; filtraciones; lámparas y techo.',false),
    (5,3,'Iluminación','Bombillos; luces de emergencia; sensores; pasillos; parqueos; escaleras; lobby; áreas sociales; fachada y zonas oscuras.',true),
    (5,4,'Puertas, cerraduras y herrajes','Puertas; cerraduras; llavines; bisagras; manubrios; cierrapuertas; barras; portones; candados y llaves.',false),
    (6,1,'Planta eléctrica','Combustible; arranque; mantenimiento; fugas; ruidos; vibración; limpieza; baterías; seguridad y bitácora.',true),
    (6,2,'Bombas / agua','Presión; fugas; ruidos; cuarto; cables; mantenimiento; cisterna/tinacos; niveles y limpieza.',false),
    (6,3,'Cámaras / DVR / acceso','Funcionamiento; grabación; ángulos; lentes; DVR/NVR; fecha/hora; respaldo; controles y tarjetas.',false),
    (6,4,'Sistema eléctrico común','Paneles; breakers; tomas; cables; luces de emergencia y cuarto eléctrico.',true),
    (7,1,'Presentación','Uniforme; ropa; calzado; carnet; cabello; barba; higiene e imagen profesional.',false),
    (7,2,'Puntualidad y turnos','Llegada; firma; relevo; ausencias; tardanzas; permanencia; horario y novedades.',false),
    (7,3,'Actitud y servicio','Trato; lenguaje; sueño; celular; discusiones; ayuda; quejas y comunicación.',false),
    (8,1,'Jardinería','Plantas; poda; hojas; riego; maceteros; césped; árboles y limpieza.',false),
    (8,2,'Fachada y perímetro','Pintura; cristales; letrero; acera; iluminación; portones; rejas; barandas; drenajes y basura.',false),
    (8,3,'Administración y seguimiento','Novedades; quejas; pendientes; fotos; responsables; fechas; proveedores; facturas y reporte.',false)
  ) as x(section_order,item_order,name,description,inventory)
    on x.section_order=s.sort_order and s.template_id=v_template
  on conflict(section_id,sort_order) do nothing;
end $$;
