import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PlantPal",
    short_name: "PlantPal",
    description: "A calm home for your houseplants — never miss a watering.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f6ee",
    theme_color: "#3e7c59",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
      {
        src: "/icons/maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
