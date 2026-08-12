"use client";
import type { CatalogItem, CatalogType } from "@/domain/catalogs";
import { seedCatalogItems } from "@/data/mock/catalogs";
const KEY = "adcondo:catalogs:v1";
const clone = <T,>(value: T): T => structuredClone(value);
export function listCatalogItems(type?: CatalogType): CatalogItem[] { let items = clone(seedCatalogItems); if (typeof window !== "undefined") { const raw = localStorage.getItem(KEY); if (raw) try { items = JSON.parse(raw); } catch {} else localStorage.setItem(KEY, JSON.stringify(items)); } return type ? items.filter(item => item.type === type).sort((a,b) => a.order-b.order) : items; }
export function saveCatalogItem(item: CatalogItem) { const all = listCatalogItems(); const next = all.some(current => current.id === item.id) ? all.map(current => current.id === item.id ? item : current) : [...all, item]; localStorage.setItem(KEY, JSON.stringify(next)); return item; }
export function toggleCatalogItem(id: string) { const all = listCatalogItems(); const next = all.map(item => item.id === id ? { ...item, active: !item.active } : item); localStorage.setItem(KEY, JSON.stringify(next)); }
