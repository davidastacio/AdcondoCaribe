import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ADCONDO DEL CARIBE",
    short_name: "ADCONDO",
    description: "Supervisión y administración de torres residenciales",
    start_url: "/supervisor",
    scope: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#061f3a",
    lang: "es-DO",
    orientation: "any",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
