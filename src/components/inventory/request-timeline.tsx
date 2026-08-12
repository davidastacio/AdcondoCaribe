import { requestStatusLabels } from "@/features/inventory/service";
import type { RequestUpdate } from "@/features/inventory/types";
import { Check } from "lucide-react";
export function MaterialRequestTimeline({updates}:{updates:RequestUpdate[]}){return <div className="request-timeline">{[...updates].reverse().map(update=><article key={update.id}><span><Check/></span><div><header><b>{requestStatusLabels[update.newStatus]}</b><time>{new Date(update.createdAt).toLocaleString("es-DO")}</time></header><p>{update.comment}</p><small>{update.userName}</small></div></article>)}</div>}
