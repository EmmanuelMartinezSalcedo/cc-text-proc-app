import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./users.js";
import translationRoutes from "./translation.js";
import summaryRoutes from "./summary.js";
import keywordsRoutes from "./keywords.js";
import editingRoutes from "./editing.js";
import { swaggerUi, swaggerSpec } from "./swagger.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/microservices/translation", translationRoutes);
app.use("/microservices/summary", summaryRoutes);
app.use("/microservices/keywords", keywordsRoutes);
app.use("/microservices/editing", editingRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
  console.log(`📖 Swagger en http://0.0.0.0:${PORT}/api-docs`);
});
