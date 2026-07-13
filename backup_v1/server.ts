import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";


const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;


// Vite Middleware for Dev and production serving
const setupServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Frontend Server running on port ${PORT}`);
  });
};

setupServer();
