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

export default router;
