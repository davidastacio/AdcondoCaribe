export function InspectionProgress({completed,total,compact=false}:{completed:number;total:number;compact?:boolean}){
  const progress = total ? Math.round((completed/total)*100) : 0;
  return <div className={`inspection-progress ${compact?"inspection-progress--compact":""}`}><div><span>Checklist completado</span><strong>{progress}%</strong></div><div className="inspection-progress__track"><i style={{width:`${progress}%`}}/></div><small>{completed} de {total} puntos verificados</small></div>
}
