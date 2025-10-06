import express from "express";
import bcrypt from "bcrypt";
import pool from "./db.js";

const router = express.Router();

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario registrado con éxito
 */
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (exists.rows.length > 0) {
      console.warn(`⚠️ Registro fallido: correo ya registrado (${email})`);
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING id, name, email`,
      [name, email, hashed]
    );

    console.log(`✅ Usuario registrado: ${email}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ ERROR en /users/register:");
    console.error("Mensaje:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Inicia sesión de un usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve el usuario
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (result.rows.length === 0) {
      console.warn(`⚠️ Login fallido: usuario no encontrado (${email})`);
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.warn(`⚠️ Login fallido: contraseña inválida (${email})`);
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    console.log(`✅ Login exitoso: ${email}`);
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error("❌ ERROR en /users/login:");
    console.error("Mensaje:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * @swagger
 * /users/history:
 *   delete:
 *     summary: Borra el historial de un usuario (requests y responses)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Historial borrado correctamente
 */
router.delete("/history", async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "Falta parámetro user_id" });
  }

  try {
    const requestResult = await pool.query(
      "SELECT id FROM requests WHERE user_id=$1",
      [user_id]
    );

    const requestIds = requestResult.rows.map((r) => r.id);

    if (requestIds.length > 0) {
      await pool.query("DELETE FROM responses WHERE request_id = ANY($1)", [
        requestIds,
      ]);

      await pool.query("DELETE FROM requests WHERE id = ANY($1)", [requestIds]);
    }

    console.log(`🗑️ Historial borrado para el usuario ${user_id}`);
    res.json({ message: "Historial borrado correctamente" });
  } catch (err) {
    console.error("❌ ERROR en /users/history:", err.message);
    console.error(err.stack);
    res.status(500).json({ error: "Error borrando el historial" });
  }
});

/**
 * @swagger
 * /users/history:
 *   get:
 *     summary: Obtiene el historial de un usuario (requests y responses)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Historial del usuario
 */
router.get("/history", async (req, res) => {
  const user_id = parseInt(req.query.user_id, 10);

  if (!user_id) {
    return res.status(400).json({ error: "Falta parámetro user_id" });
  }

  try {
    const requestResult = await pool.query(
      "SELECT id, service_type, input_text, created_at FROM requests WHERE user_id=$1 ORDER BY created_at DESC",
      [user_id]
    );

    const history = [];

    for (const reqRow of requestResult.rows) {
      const responseResult = await pool.query(
        "SELECT output_json, created_at FROM responses WHERE request_id=$1",
        [reqRow.id]
      );

      history.push({
        request_id: reqRow.id,
        service_type: reqRow.service_type,
        input_text: reqRow.input_text,
        request_created_at: reqRow.created_at,
        response: responseResult.rows[0]?.output_json || null,
        response_created_at: responseResult.rows[0]?.created_at || null,
      });
    }

    res.json({ user_id, history });
  } catch (err) {
    console.error("❌ ERROR en GET /users/history:", err.message);
    console.error(err.stack);
    res.status(500).json({ error: "Error obteniendo el historial" });
  }
});

export default router;
