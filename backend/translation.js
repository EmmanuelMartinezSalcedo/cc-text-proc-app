import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * @swagger
 * /microservice/translation:
 *   post:
 *     summary: Traduce texto usando el microservicio de traducción
 *     tags: [Microservice]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - targetLang
 *             properties:
 *               text:
 *                 type: string
 *               targetLang:
 *                 type: string
 *     responses:
 *       200:
 *         description: Texto traducido
 */
router.post("/", async (req, res) => {
  const { text, targetLang } = req.body;

  if (!text || !targetLang) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros text o targetLang" });
  }

  try {
    const response = await axios.post(
      "http://translation-service.microservice.svc.cluster.local:5000/translate",
      { text, targetLang }
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ ERROR en /microservice/translation:", err.message);
    res
      .status(500)
      .json({ error: "Error llamando al microservicio de traducción" });
  }
});

export default router;
