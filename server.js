const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 8000;
const root = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    const safePath = req.url === "/" ? "/index.html" : req.url;
    const filePath = path.join(root, path.normalize(safePath).replace(/^(\.\.[\/\\])+/, ""));
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === "ENOENT") {
          res.writeHead(404, { "Content-Type": "text/plain; charset=UTF-8" });
          res.end("404 Not Found");
          return;
        }

        res.writeHead(500, { "Content-Type": "text/plain; charset=UTF-8" });
        res.end("500 Internal Server Error");
        return;
      }

      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    });
  })
  .listen(port, () => {
    console.log(`Imperial Homes running at http://localhost:${port}`);
  });
