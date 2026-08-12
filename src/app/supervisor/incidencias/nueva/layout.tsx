import { Suspense } from "react";

export default function NewIncidentLayout({children}:{children:React.ReactNode}){
  return <Suspense fallback={<div className="incident-detail-loading">Preparando formulario...</div>}>{children}</Suspense>
}
