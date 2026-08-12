export type StorageBucket = "inspection-photos"|"incident-photos"|"inventory-photos"|"documents"|"avatars";
export interface UploadContext { bucket: StorageBucket; ownerId: string; towerId?: string; entityId?: string }
export interface StoredFile { storageKey: string; previewUrl?: string; mimeType: string; size: number }
export interface StorageRepository { upload(file: File, context: UploadContext): Promise<StoredFile>; remove(storageKey: string): Promise<void>; getUrl(storageKey: string): Promise<string>; validate(file: File): { valid: boolean; error?: string } }
