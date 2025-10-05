import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./users.js";
import { swaggerUi, swaggerSpec } from "./swagger.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// rutas
app.use("/users", userRoutes);

// documentación
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📖 Swagger en http://localhost:${PORT}/api-docs`);
});
