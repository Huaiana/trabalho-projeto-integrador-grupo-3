import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Techocean — Amarração e Segurança de Cargas" },
      { name: "description", content: "Precisão em cada amarração. Segurança e cuidado para cargas em operações portuárias." },
      { property: "og:title", content: "Techocean — Amarração e Segurança de Cargas" },
      { property: "og:description", content: "Precisão em cada amarração. Segurança e cuidado para cargas em operações portuárias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
