// Local preview without the Vercel CLI:  npm run dev  ->  http://localhost:3000
// Serves the static files and the same API function Vercel runs.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./api/proof-candidates.js";

const ROOT = fileURLToPath(new URL("./public/", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };
const PUBLIC = new Set(["/index.html", "/styles.css", "/app.js", "/favicon.svg", "/logo.svg"]);

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/proof-candidates") {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    req.body = raw;
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (obj) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(obj)); return res; };
    return handler(req, res);
  }
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  if (!PUBLIC.has(path)) { res.statusCode = 404; return res.end("Not found"); }
  try {
    const file = await readFile(join(ROOT, path));
    res.setHeader("content-type", TYPES[extname(path)] || "application/octet-stream");
    res.end(file);
  } catch { res.statusCode = 404; res.end("Not found"); }
}).listen(process.env.PORT || 3000, () => {
  console.log(`Running at http://localhost:${process.env.PORT || 3000}`);
  console.log(process.env.ANTHROPIC_API_KEY ? "AI mode: on (key found)" : "AI mode: off (no key) – using the rule-based engine");
});
