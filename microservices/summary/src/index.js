import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "resumen" });
});

app.post("/summarize", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Missing text" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Summarize the following text and respond **ONLY** with a JSON object: {"summary": "..."}.\nText: "${text}"`,
    });

    let cleaned = response.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const summaryJson = JSON.parse(cleaned);

    res.json({
      original: text,
      summary: summaryJson.summary,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Summarization failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Microservicio Resumen corriendo en puerto ${PORT}`);
});
