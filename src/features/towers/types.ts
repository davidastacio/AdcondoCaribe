export type TowerStatus="ACTIVE"|"OBSERVATION"|"MAINTENANCE"|"INACTIVE";
export type TowerType="TOWER"|"CONDOMINIUM"|"RESIDENTIAL";
export interface TowerContact{id:string;type:string;name:string;phone:string;email:string;notes?:string}
export interface TowerActivity{id:string;date:string;user:string;action:string;entity:string;href?:string}
export interface TowerDocument{id:string;name:string;category:string;date:string;uploadedBy:string}
export interface TowerPhoto{id:string;url:string;date:string;origin:"Visita"|"Incidencia"|"Inventario"|"Otros";supervisor:string}
export interface Tower{id:string;code:string;name:string;type:TowerType;address:string;sector:string;city:string;province:string;locationReference?:string;floors?:number;apartments?:number;parkingSpaces?:number;elevators?:number;yearBuilt?:number;blocks?:number;hasPool:boolean;hasGym:boolean;hasSocialArea:boolean;hasGenerator:boolean;hasElevators:boolean;hasCameras:boolean;hasWaterTank:boolean;hasPumps:boolean;status:TowerStatus;notes?:string;contacts:TowerContact[];supervisors:string[];lastVisit?:string;nextVisit?:string;documents:TowerDocument[];photos:TowerPhoto[];activity:TowerActivity[];createdAt:string;updatedAt:string}
export type TowerInput=Omit<Tower,"id"|"code"|"documents"|"photos"|"activity"|"createdAt"|"updatedAt"> & {code?:string};
