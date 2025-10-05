import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * @swagger
 * /microservices/analytics:
 *   post:
 *     summary: Analiza texto usando el microservicio de analytics
 *     tags: [Microservices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Datos analíticos del texto
 */
router.post("/", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Falta parámetro text" });
  }

  try {
    const response = await axios.post(
      "http://analytics-service.microservice.svc.cluster.local:5004/analyze",
      { text }
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ ERROR en /microservice/analytics:", err.message);
    res
      .status(500)
      .json({ error: "Error llamando al microservicio de analytics" });
  }
});

export default router;
