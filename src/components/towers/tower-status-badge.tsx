import type {TowerStatus} from "@/features/towers/types";const towerStatusLabels:Record<TowerStatus,string>={ACTIVE:"Activa",OBSERVATION:"En observación",MAINTENANCE:"Mantenimiento",INACTIVE:"Inactiva"};
export function TowerStatusBadge({status}:{status:TowerStatus}){return <span className={`tower-status tower-status--${status.toLowerCase()}`}>{towerStatusLabels[status]}</span>}
