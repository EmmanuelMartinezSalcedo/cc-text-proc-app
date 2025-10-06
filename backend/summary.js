import express from "express";
import axios from "axios";
import pool from "./db.js";

const router = express.Router();

/**
 * @swagger
 * /microservices/summary:
 *   post:
 *     summary: Resume texto usando el microservicio de summary
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
 *             properties:
 *               user_id:
 *                 type: integer
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Texto resumido
 */
router.post("/", async (req, res) => {
  const { user_id, text } = req.body;

  if (!user_id || !text) {
    return res.status(400).json({ error: "Faltan parámetros user_id o text" });
  }

  let requestId;

  try {
    const requestResult = await pool.query(
      `INSERT INTO requests (user_id, service_type, input_text, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [user_id, "summary", text]
    );
    requestId = requestResult.rows[0].id;

    const response = await axios.post(
      "http://summary-service.microservice.svc.cluster.local:5001/summarize",
      { text }
    );

    await pool.query(
      `INSERT INTO responses (request_id, output_json, created_at)
       VALUES ($1, $2, NOW())`,
      [requestId, JSON.stringify(response.data)]
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ ERROR en /microservice/summary:", err.message);

    if (requestId) {
      await pool.query(
        `INSERT INTO responses (request_id, output_json, created_at)
         VALUES ($1, $2, NOW())`,
        [requestId, JSON.stringify({ error: err.message })]
      );
    }

    res
      .status(500)
      .json({ error: "Error llamando al microservicio de summary" });
  }
});

export default router;
