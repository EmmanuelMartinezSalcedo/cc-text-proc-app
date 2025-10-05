import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(bodyParser.json());

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "analytics" });
});

app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Missing text" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following text, preserving the original language. Respond **ONLY** with a JSON object containing: {"sentiment": "...", "wordCount": ..., "sentenceCount": ..., "mainTopics": ["..."]}.\nText: "${text}"`,
    });

    let cleaned = response.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const analyticsJson = JSON.parse(cleaned);

    res.json(analyticsJson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Text analysis failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Microservicio Analytics corriendo en puerto ${PORT}`);
});
