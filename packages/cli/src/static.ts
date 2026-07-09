import fs from 'node:fs/promises';
import path from 'node:path';
import type { Context } from 'hono';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

export function mimeFor(filePath: string): string {
  return MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

async function readIfExists(abs: string): Promise<Buffer | null> {
  try {
    const stat = await fs.stat(abs);
    if (!stat.isFile()) return null;
    return await fs.readFile(abs);
  } catch {
    return null;
  }
}

function cacheControl(rel: string): string {
  // Vite emits content-hashed files under assets/ - safe to cache forever.
  return rel.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache';
}

/**
 * Serve the built web app from `publicDir` with an SPA fallback to index.html.
 * If the app has not been built (dev / first run), show a friendly placeholder.
 */
export async function serveWebApp(c: Context, publicDir: string): Promise<Response> {
  const pathname = decodeURIComponent(new URL(c.req.url).pathname);
  let rel = pathname.replace(/^\/+/, '');
  if (rel === '') rel = 'index.html';

  const abs = path.resolve(publicDir, rel);
  if (abs !== publicDir && !abs.startsWith(publicDir + path.sep)) {
    return c.notFound();
  }

  const file = await readIfExists(abs);
  if (file) {
    return new Response(file, {
      headers: { 'content-type': mimeFor(abs), 'cache-control': cacheControl(rel) },
    });
  }

  const index = await readIfExists(path.join(publicDir, 'index.html'));
  if (index) {
    return new Response(index, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' },
    });
  }

  return c.html(PLACEHOLDER, 200);
}

const PLACEHOLDER = `<!doctype html><html><head><meta charset="utf-8"><title>Okapi</title>
<style>body{font-family:ui-sans-serif,system-ui,sans-serif;background:#0A0A0E;color:#ECECEF;display:grid;place-items:center;height:100vh;margin:0}
.card{max-width:32rem;padding:2rem;text-align:center}code{background:#1C1C24;padding:.15rem .4rem;border-radius:6px}</style></head>
<body><div class="card"><h1>🦌 Okapi</h1><p>The API is running, but the web app has not been built.</p>
<p>Run <code>pnpm build</code>, or during development open the Vite dev server (usually <code>http://localhost:5173</code>).</p></div></body></html>`;
