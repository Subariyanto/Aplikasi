import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Increase body size limit for base64 audio uploads (up to 50MB)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Action Items Extraction Endpoint using Gemini 3.6 Flash
  app.post("/api/extract-action-items", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY environment variable is missing on the server."
        });
      }

      const { audioData, mimeType, transcript, contextNote } = req.body;

      if (!audioData && !transcript) {
        return res.status(400).json({
          error: "Please provide either audio file data or call transcript text."
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      const promptSystemInstruction = `You are an expert sales call reviewer and executive meeting analyst.
Your mandate is to rigorously analyze sales calls, negotiations, and business audio recordings or transcripts, and extract ALL EXPLICIT action items that were agreed upon by either party.

CRITICAL INSTRUCTIONS:
1. ONLY include explicit action items where a party clearly agreed, committed, promised, or volunteered to perform a specific task or follow-up action.
2. Clearly distinguish between Party A (e.g. Sales Representative / Provider / Vendor) and Party B (e.g. Client / Buyer / Madrasah Principal / Prospect / Partner).
3. Specify exact deliverables, specific deadlines/timeframes mentioned (e.g. "by Friday end of day", "next Monday at 10 AM", "within 3 business days"), and assign priority levels.
4. Extract key high-level agreements and unresolved points that require future follow-up.
5. Provide clear, professional Indonesian & English bilingual or context-matching terminology.`;

      const contents: any[] = [];

      if (contextNote) {
        contents.push({ text: `Call Context / Background Info: ${contextNote}` });
      }

      if (audioData) {
        // Handle inline base64 audio data
        const cleanBase64 = audioData.replace(/^data:audio\/[a-zA-Z0-9]+;base64,/, "");
        contents.push({
          inlineData: {
            mimeType: mimeType || "audio/mp3",
            data: cleanBase64
          }
        });
        contents.push({
          text: "Review this uploaded sales call audio carefully. Extract all explicit action items that were agreed upon by either party. Return the extracted data in strict JSON format."
        });
      } else if (transcript) {
        contents.push({
          text: `Review the following sales call transcript carefully:\n\n${transcript}\n\nExtract all explicit action items agreed upon by either party. Return the extracted data in strict JSON format.`
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction: promptSystemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              callSummary: {
                type: Type.STRING,
                description: "Brief summary of the sales call, key parties involved, and call purpose."
              },
              overallSentiment: {
                type: Type.STRING,
                description: "Overall tone or deal outcome (e.g., 'Highly Interested - Closing Stage', 'Agreement Reached', 'Needs Technical Review')."
              },
              partyAName: {
                type: Type.STRING,
                description: "Name or role representing Party A (e.g., Sales Rep / Solution Consultant / Subariyanto Team)."
              },
              partyBName: {
                type: Type.STRING,
                description: "Name or role representing Party B (e.g., Madrasah Principal / Prospect / Buyer)."
              },
              actionItems: {
                type: Type.ARRAY,
                description: "List of explicit action items agreed upon by either party during the call.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    task: { type: Type.STRING, description: "Clear task starting with an action verb." },
                    owner: { type: Type.STRING, description: "Name or role of person/party who committed to this task." },
                    party: { 
                      type: Type.STRING, 
                      description: "Must be 'party_a', 'party_b', or 'joint'." 
                    },
                    deadline: { type: Type.STRING, description: "Specific agreed deadline or timeframe mentioned." },
                    deliverables: { type: Type.STRING, description: "Deliverable or tangible output promised." },
                    priority: { type: Type.STRING, description: "'high', 'medium', or 'low'." }
                  },
                  required: ["task", "owner", "party", "deadline", "priority"]
                }
              },
              keyAgreements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Explicit terms, pricing, or decisions mutually agreed upon during the call."
              },
              unresolvedPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Questions or open issues that were raised but deferred to future calls."
              }
            },
            required: ["callSummary", "partyAName", "partyBName", "actionItems", "keyAgreements"]
          }
        }
      });

      const jsonText = response.text || "{}";
      const parsed = JSON.parse(jsonText);

      return res.json({
        success: true,
        data: parsed
      });
    } catch (err: any) {
      console.error("Error in /api/extract-action-items:", err);
      return res.status(500).json({
        error: "Failed to process audio or transcript with AI",
        details: err?.message || String(err)
      });
    }
  });

  // Vite middleware in dev or static server in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
