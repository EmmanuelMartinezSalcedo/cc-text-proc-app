import express from "express";
import axios from "axios";
import pool from "./db.js";

const router = express.Router();

/**
 * @swagger
 * /microservices/editing:
 *   post:
 *     summary: Edita o mejora texto usando el microservicio de editing
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
 *               - style
 *             properties:
 *               user_id:
 *                 type: integer
 *               text:
 *                 type: string
 *               style:
 *                 type: string
 *                 description: Estilo opcional de la edición
 *     responses:
 *       200:
 *         description: Texto editado
 */
router.post("/", async (req, res) => {
  const { user_id, text, style } = req.body;

  if (!user_id || !text || !style) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros user_id, text o style" });
  }

  let requestId;

  try {
    const requestResult = await pool.query(
      `INSERT INTO requests (user_id, service_type, input_text, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [user_id, "editing", text]
    );
    requestId = requestResult.rows[0].id;

    const response = await axios.post(
      "http://editing-service.microservice.svc.cluster.local:5003/edit",
      { text, style }
    );

    await pool.query(
      `INSERT INTO responses (request_id, output_json, created_at)
       VALUES ($1, $2, NOW())`,
      [requestId, JSON.stringify(response.data)]
    );

    res.json({ edited: response.data.edited });
  } catch (err) {
    console.error("❌ ERROR en /microservice/editing:", err.message);

    if (requestId) {
      await pool.query(
        `INSERT INTO responses (request_id, output_json, created_at)
         VALUES ($1, $2, NOW())`,
        [requestId, JSON.stringify({ error: err.message })]
      );
    }

    res
      .status(500)
      .json({ error: "Error llamando al microservicio de editing" });
  }
});

export default router;
