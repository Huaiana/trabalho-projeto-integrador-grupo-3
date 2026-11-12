import { createFileRoute } from "@tanstack/react-router";

// Same-origin relay to the Techocean API, so the browser never hits its CORS allow-list.
const UPSTREAM = "https://techocean-api.huaydarc.workers.dev";

async function relay({ request }: { request: Request }) {
  const url = new URL(request.url);
  const target = UPSTREAM + url.pathname.replace(/^\/api/, "") + url.search;
  const headers = new Headers();
  for (const name of ["authorization", "content-type", "accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const hasBody = !["GET", "HEAD"].includes(request.method);
  const res = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : null,
  });
  const out = new Headers();
  const type = res.headers.get("content-type");
  if (type) out.set("content-type", type);
  return new Response(res.body, { status: res.status, headers: out });
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: { GET: relay, POST: relay, PUT: relay, DELETE: relay, PATCH: relay },
  },
});
