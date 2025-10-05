import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool
  .connect()
  .then((client) => {
    console.log("✅ Conectado a Postgres correctamente");
    client.release();
  })
  .catch((err) => {
    console.error("❌ Error conectando a Postgres:");
    console.error(err.message);
    console.error(err.stack);
  });

export default pool;
