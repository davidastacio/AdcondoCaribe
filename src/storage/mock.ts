import type { StorageRepository } from "./contracts";
export const mockStorageRepository: StorageRepository = {
  validate(file){if(file.size>10*1024*1024)return{valid:false,error:"El archivo supera 10 MB."};return{valid:true}},
  async upload(file,context){const check=this.validate(file);if(!check.valid)throw new Error(check.error);return{storageKey:`mock/${context.bucket}/${context.entityId??context.ownerId}/${crypto.randomUUID()}-${file.name}`,previewUrl:URL.createObjectURL(file),mimeType:file.type,size:file.size}},
  async remove(storageKey){void storageKey},
  async getUrl(storageKey){return storageKey.startsWith("mock/")?"":storageKey},
};
