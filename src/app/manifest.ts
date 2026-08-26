import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ADCONDO DEL CARIBE",
    short_name: "ADCONDO",
    description: "Supervisión y administración de torres residenciales",
    start_url: "/supervisor",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#061f3a",
    lang: "es-DO",
    icons: [{ src: "/assets/adcondo-logo.png", sizes: "any", type: "image/png", purpose: "any" }],
  };
}

