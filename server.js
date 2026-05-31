import { createServer } from "http";
import { join, extname } from "path";
import { promises as fs } from "fs";
import { toNodeHandler } from "srvx/node";
import server from "./dist/server/server.js";

const ssrHandler = toNodeHandler(server.fetch);
const port = process.env.PORT || 3000;

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Try serving from dist/client (static files)
  try {
    const filePath = join(process.cwd(), "dist/client", pathname);
    const stats = await fs.stat(filePath);
    
    if (stats.isFile()) {
      const data = await fs.readFile(filePath);
      const ext = extname(filePath).toLowerCase();
      res.writeHead(200, { 
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "Cache-Control": pathname.startsWith("/assets/") 
          ? "public, max-age=31536000, immutable" 
          : "no-cache"
      });
      res.end(data);
      return;
    }
  } catch (err) {
    // File not found or couldn't read, proceed to SSR
  }

  // Handle with TanStack Start SSR
  ssrHandler(req, res);
}).listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
