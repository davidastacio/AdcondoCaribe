import {towerStatusLabels} from "@/features/towers/service";import type {TowerStatus} from "@/features/towers/types";
export function TowerStatusBadge({status}:{status:TowerStatus}){return <span className={`tower-status tower-status--${status.toLowerCase()}`}>{towerStatusLabels[status]}</span>}
