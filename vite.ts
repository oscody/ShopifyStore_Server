import express, { type Express } from "express";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// CORS middleware for API server
export function setupCORS(app: Express) {
  app.use((req, res, next) => {
    // Get the origin from the request
    const origin = req.headers.origin;

    // Define allowed origins
    const allowedOrigins = [
      "http://localhost:5173", // Development
      "https://oscody.github.io", // GitHub Pages
      "https://storefrontclient.netlify.app", // Netlify deployment
      process.env.FRONTEND_URL, // Custom frontend URL if set
    ].filter(Boolean); // Remove undefined values

    // Check if the origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    } else if (process.env.NODE_ENV === "development") {
      // In development, allow localhost with any port
      res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    } else {
      // In production, allow the first allowed origin as fallback
      res.header(
        "Access-Control-Allow-Origin",
        allowedOrigins[0] || "https://oscody.github.io"
      );
    }

    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}
