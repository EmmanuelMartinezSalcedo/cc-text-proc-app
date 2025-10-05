import express from "express";
import axios from "axios";

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
 *               - text
 *               - count
 *             properties:
 *               text:
 *                 type: string
 *               count:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Lista de keywords
 */
router.post("/", async (req, res) => {
  const { text, count } = req.body;

  if (!text || !count) {
    return res.status(400).json({ error: "Faltan parámetros text o count" });
  }

  try {
    const response = await axios.post(
      "http://keywords-service.microservice.svc.cluster.local:5002/keywords",
      { text, count }
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ ERROR en /microservice/keywords:", err.message);
    res
      .status(500)
      .json({ error: "Error llamando al microservicio de keywords" });
  }
});

export default router;
