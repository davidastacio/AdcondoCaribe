export type AppRole="ADMIN"|"SUPERVISOR"|"INCIDENT_SUPERVISOR";export type UserStatus="ACTIVE"|"INACTIVE"|"SUSPENDED"|"PENDING";export type AssignmentStatus="ACTIVE"|"ENDED"|"SUSPENDED";
export interface AppUser{id:string;firebaseUid?:string;firstName:string;lastName:string;email:string;phone?:string;avatarUrl?:string;jobTitle?:string;role:AppRole;status:UserStatus;notes?:string;lastLoginAt?:string;createdAt:string;updatedAt:string}
export interface TowerAssignment{id:string;towerId:string;towerName?:string;towerCode?:string;supervisorId:string;assignedById:string;assignedBy:string;status:AssignmentStatus;startDate:string;endDate?:string;workDays:number[];shiftStart?:string;shiftEnd?:string;endedBy?:string;notes?:string;createdAt:string;updatedAt:string}
export interface UserActivity{id:string;userId:string;actor:string;action:string;date:string}
export type UserInput=Omit<AppUser,"id"|"createdAt"|"updatedAt"|"lastLoginAt"|"firebaseUid">;
