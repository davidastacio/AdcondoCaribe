"use client";
import type { AppDocument } from "@/features/reports/types";
import { FileText, Upload } from "lucide-react";
import Link from "next/link";

export function TowerDocuments({ documents }: { documents: AppDocument[] }) {
  return <><div className="section-action"><h2>Documentos de la torre</h2><Link className="btn btn--primary" href="/admin/documentos"><Upload /> Gestionar documentos</Link></div><div className="tower-documents">{documents.length ? documents.map((document) => <article key={document.id}><FileText /><div><b>{document.fileUrl ? <a href={document.fileUrl}>{document.name}</a> : document.name}</b><small>{document.category} · {new Date(document.documentDate).toLocaleDateString("es-DO")}</small></div><span>{document.uploadedBy}</span></article>) : <p>No hay documentos registrados para esta torre.</p>}</div></>;
}
