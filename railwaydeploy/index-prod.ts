import dotenv from "dotenv";
import express from "express";
import runApp from "./app";

dotenv.config();

// Backend-only mode: No static file serving
// Frontend is deployed separately on Vercel
export async function serveStatic(app: express.Express, _server: any) {
  // Add CORS headers for frontend on Vercel
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Allow requests from your Vercel frontend and localhost (for development)
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5000",
      "https://localhost:3000",
      "https://localhost:5000",
    ];
    
    if (!origin || allowedOrigins.includes(origin) || origin?.includes("vercel.app")) {
      res.header("Access-Control-Allow-Origin", origin || "*");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization"
      );
    }
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    
    next();
  });

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", message: "Backend is running!" });
  });
}

(async () => {
  await runApp(serveStatic);
})();
