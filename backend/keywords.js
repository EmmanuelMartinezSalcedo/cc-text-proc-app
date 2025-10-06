import express from "express";
import axios from "axios";
import pool from "./db.js";

const router = express.Router();

/**
 * @swagger
 * /microservices/keywords:
 *   post:
 *     summary: Extrae keywords usando el microservicio de keywords
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
 *               - count
 *             properties:
 *               user_id:
 *                 type: integer
 *               text:
 *                 type: string
 *               count:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Lista de keywords
 */
router.post("/", async (req, res) => {
  const { user_id, text, count } = req.body;

  if (!user_id || !text || !count) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros user_id, text o count" });
  }

  let requestId;

  try {
    const requestResult = await pool.query(
      `INSERT INTO requests (user_id, service_type, input_text, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [user_id, "keywords", text]
    );
    requestId = requestResult.rows[0].id;

    const response = await axios.post(
      "http://keywords-service.microservice.svc.cluster.local:5002/keywords",
      { text, count }
    );

    await pool.query(
      `INSERT INTO responses (request_id, output_json, created_at)
       VALUES ($1, $2, NOW())`,
      [requestId, JSON.stringify(response.data)]
    );

    res.json({ keywords: response.data.keywords });
  } catch (err) {
    console.error("❌ ERROR en /microservice/keywords:", err.message);

    if (requestId) {
      await pool.query(
        `INSERT INTO responses (request_id, output_json, created_at)
         VALUES ($1, $2, NOW())`,
        [requestId, JSON.stringify({ error: err.message })]
      );
    }

    res
      .status(500)
      .json({ error: "Error llamando al microservicio de keywords" });
  }
});

export default router;
