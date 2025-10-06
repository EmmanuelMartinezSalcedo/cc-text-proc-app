import express from "express";
import axios from "axios";
import pool from "./db.js";

const router = express.Router();

/**
 * @swagger
 * /microservices/translation:
 *   post:
 *     summary: Traduce texto usando el microservicio de traducción
 *     tags: [Microservices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - text
 *               - targetLang
 *             properties:
 *               user_id:
 *                 type: integer
 *               text:
 *                 type: string
 *               targetLang:
 *                 type: string
 *     responses:
 *       200:
 *         description: Texto traducido
 */

router.post("/", async (req, res) => {
  const { user_id, text, targetLang } = req.body;

  if (!user_id || !text || !targetLang) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros user_id, text o targetLang" });
  }

  let requestId;

  try {
    const requestResult = await pool.query(
      `INSERT INTO requests (user_id, service_type, input_text, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [user_id, "translation", text]
    );
    requestId = requestResult.rows[0].id;

    const response = await axios.post(
      "http://translation-service.microservice.svc.cluster.local:5000/translate",
      { text, targetLang }
    );

    await pool.query(
      `INSERT INTO responses (request_id, output_json, created_at)
       VALUES ($1, $2, NOW())`,
      [requestId, JSON.stringify(response.data)]
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ ERROR en /microservice/translation:", err.message);

    if (requestId) {
      await pool.query(
        `INSERT INTO responses (request_id, output_json, created_at)
         VALUES ($1, $2, NOW())`,
        [requestId, JSON.stringify({ error: err.message })]
      );
    }

    res
      .status(500)
      .json({ error: "Error llamando al microservicio de traducción" });
  }
});

export default router;
