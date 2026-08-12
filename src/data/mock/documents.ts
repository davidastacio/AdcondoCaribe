import type { AppDocument } from "@/features/reports/types";
export const seedDocuments: AppDocument[]=[
  {id:"doc-1",towerId:"tower-tree-iii",towerName:"Tree Tower III",name:"Reglamento del condominio",category:"Reglamentos",description:"Normativa vigente",uploadedById:"usr-admin",uploadedBy:"Laura Méndez",documentDate:"2026-07-10",status:"ACTIVE",createdAt:"2026-07-10",updatedAt:"2026-07-10"},
  {id:"doc-2",towerId:"tower-verde-mare",towerName:"Torre Verde Mare",name:"Manual planta eléctrica",category:"Manuales",uploadedById:"usr-admin",uploadedBy:"Laura Méndez",documentDate:"2026-06-15",status:"ACTIVE",createdAt:"2026-06-15",updatedAt:"2026-06-15"},
  {id:"doc-3",towerId:"tower-villa",towerName:"Villa del Piantini",name:"Certificación de ascensores",category:"Certificaciones",uploadedById:"usr-admin",uploadedBy:"Laura Méndez",documentDate:"2026-08-01",status:"ACTIVE",createdAt:"2026-08-01",updatedAt:"2026-08-01"},
];
