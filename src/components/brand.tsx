import Image from "next/image";
import Link from "next/link";

export function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className={`brand ${light ? "brand--light" : ""}`} aria-label="ADCONDO del Caribe">
      <span className="brand__mark"><Image src="/assets/adcondo-logo.png" alt="" fill sizes="56px" priority /></span>
      {!compact && <span className="brand__name">ADCONDO <small>DEL CARIBE</small></span>}
    </Link>
  );
}
