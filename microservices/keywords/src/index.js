import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(bodyParser.json());

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "keywords" });
});

app.post("/keywords", async (req, res) => {
  const { text, count } = req.body;

  if (!text || !count) {
    return res.status(400).json({ error: "Missing text or count" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract the top ${count} keywords from the following text and respond **ONLY** with a JSON array: {"keywords": ["..."]}.\nText: "${text}"`,
    });

    let cleaned = response.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const keywordsJson = JSON.parse(cleaned);

    res.json({
      original: text,
      keywords: keywordsJson.keywords,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Keyword extraction failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Microservicio Keywords corriendo en puerto ${PORT}`);
});
