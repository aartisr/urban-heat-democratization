import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Spectral Urbanism Thermal Math Lab" });
  });

  // AI Thermal Assistant API Endpoint
  app.post("/api/explain-thermal-math", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY environment variable is not configured.",
          hint: "Set GEMINI_API_KEY in the AI Studio environment variables."
        });
      }

      const { prompt, contextStep, parameters } = req.body;
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are the Urban Thermal Physics AI Tutor specializing in Spectral Urbanism, Urban Heat Island (UHI) dynamics, Surface Energy Balance (SEB), Sky View Factor (SVF), and Thermal Graph inference (GMRF).
Your job is to explain the thermal math concepts clearly, concisely, with physical intuition, mathematical formulas, and practical microclimate engineering advice.
Keep explanations structured, easy to follow, and directly tied to the user's selected lab step and input parameters. Avoid overly verbose non-technical chatter.`;

      const userMessage = `Context Step: ${contextStep || 'General UHI Math'}
User Question: ${prompt}
Current Parameters: ${JSON.stringify(parameters || {}, null, 2)}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemInstruction}\n\n${userMessage}` }] }
        ]
      });

      res.json({
        reply: response.text || "No explanation generated."
      });
    } catch (error: any) {
      console.error("Error in AI explanation endpoint:", error);
      res.status(500).json({
        error: error.message || "Failed to generate AI explanation"
      });
    }
  });

  // Vite middleware for development vs static production serving
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
    console.log(`Urban Thermal Math Lab server running on http://localhost:${PORT}`);
  });
}

startServer();
