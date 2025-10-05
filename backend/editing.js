import express from "express";
import axios from "axios";

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
 *               - text
 *             properties:
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
  const { text, style } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Falta parámetro text" });
  }

  try {
    const response = await axios.post(
      "http://editing-service.microservice.svc.cluster.local:5003/edit",
      { text, style }
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ ERROR en /microservice/editing:", err.message);
    res
      .status(500)
      .json({ error: "Error llamando al microservicio de editing" });
  }
});

export default router;
