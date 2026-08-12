import type { LucideIcon } from "lucide-react";

export function IconBox({ icon: Icon, tone = "blue" }: { icon: LucideIcon; tone?: string }) {
  return <span className={`icon-box icon-box--${tone}`}><Icon size={19} strokeWidth={2.2} /></span>;
}

export function Status({ children, tone = "blue" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`status status--${tone}`}>{children}</span>;
}

export function ProgressRing({ value, color = "#1769f6", label }: { value: number; color?: string; label?: string }) {
  return (
    <div className="progress-ring" style={{ background: `conic-gradient(${color} ${value * 3.6}deg, #e8edf5 0)` }}>
      <div><strong>{value}%</strong><span>{label ?? "Completado"}</span></div>
    </div>
  );
}
