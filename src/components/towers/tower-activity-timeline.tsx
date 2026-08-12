import type {TowerActivity} from "@/features/towers/types";import {Check} from "lucide-react";
export function TowerActivityTimeline({items}:{items:TowerActivity[]}){return <div className="tower-timeline">{items.map(a=><article key={a.id}><span><Check/></span><div><b>{a.action}</b><p>{a.user} · {a.entity}</p><time>{new Date(a.date).toLocaleString("es-DO")}</time></div></article>)}</div>}
