"use client";

const DB_NAME = "adcondo-offline";
const DB_VERSION = 1;
const SNAPSHOTS = "snapshots";
const QUEUE = "queue";

export type OfflineRequest = {
  id: string;
  url: string;
  method: "POST" | "PATCH" | "DELETE";
  body?: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SNAPSHOTS)) database.createObjectStore(SNAPSHOTS);
      if (!database.objectStoreNames.contains(QUEUE)) database.createObjectStore(QUEUE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const tx = database.transaction(storeName, mode);
    const request = action(tx.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => database.close();
  });
}

export function saveOfflineSnapshot(key: string, value: unknown) {
  return transaction(SNAPSHOTS, "readwrite", store => store.put({ value, savedAt: Date.now() }, key));
}

export async function readOfflineSnapshot<T>(key: string): Promise<T | undefined> {
  const record = await transaction<{ value: T } | undefined>(SNAPSHOTS, "readonly", store => store.get(key));
  return record?.value;
}

export async function queueJsonRequest(input: Omit<OfflineRequest, "createdAt" | "attempts" | "body"> & { body?: unknown }) {
  const previous = await transaction<OfflineRequest | undefined>(QUEUE, "readonly", store => store.get(input.id));
  await transaction(QUEUE, "readwrite", store => store.put({
    ...input,
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
    createdAt: previous?.createdAt ?? Date.now(),
    attempts: previous?.attempts ?? 0,
  } satisfies OfflineRequest));
  window.dispatchEvent(new Event("adcondo:offline-queue"));
}

export async function pendingOfflineCount() {
  return transaction<number>(QUEUE, "readonly", store => store.count());
}

async function queuedRequests() {
  const requests = await transaction<OfflineRequest[]>(QUEUE, "readonly", store => store.getAll());
  return requests.sort((a, b) => a.createdAt - b.createdAt);
}

export async function syncOfflineRequests() {
  if (!navigator.onLine) return { synced: 0, pending: await pendingOfflineCount() };
  let synced = 0;
  for (const item of await queuedRequests()) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.body ? { "content-type": "application/json" } : undefined,
        body: item.body,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? `Error ${response.status}`);
      }
      await transaction(QUEUE, "readwrite", store => store.delete(item.id));
      synced += 1;
    } catch (error) {
      await transaction(QUEUE, "readwrite", store => store.put({
        ...item,
        attempts: item.attempts + 1,
        lastError: error instanceof Error ? error.message : "No se pudo sincronizar.",
      } satisfies OfflineRequest));
      break;
    }
  }
  const pending = await pendingOfflineCount();
  window.dispatchEvent(new Event("adcondo:offline-queue"));
  return { synced, pending };
}

