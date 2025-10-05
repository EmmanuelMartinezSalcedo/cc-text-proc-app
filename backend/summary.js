import express from "express";
import axios from "axios";

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
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Texto resumido
 */
router.post("/", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Falta parámetro text" });
  }

  try {
    const response = await axios.post(
      "http://summary-service.microservice.svc.cluster.local:5001/summarize",
      { text }
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ ERROR en /microservice/summary:", err.message);
    res
      .status(500)
      .json({ error: "Error llamando al microservicio de summary" });
  }
});

export default router;
