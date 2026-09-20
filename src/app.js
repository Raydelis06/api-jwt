import "dotenv/config"
import express from "express"
import { loggerMiddleware } from "./middlewares/logger.middleware.js"
import { apiKeyMiddleware } from "./middlewares/apiKey.middleware.js"
import { verificarToken } from "./middlewares/auth.middleware.js"
import authRoutes from "./routes/auth.routes.js"
import v1TareasRoutes from "./routes/v1/tareas.routes.js"
import v2TareasRoutes from "./routes/v2/tareas.routes.js"

const app = express()

app.use(express.json())
app.use(loggerMiddleware)

// Rutas públicas
app.use("/auth", authRoutes)

// Fase 1 — API Key
app.use("/v1/tareas", apiKeyMiddleware, v1TareasRoutes)

// Fase 2 — JWT con roles
app.use("/v2/tareas", verificarToken, v2TareasRoutes)

app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(500).json({ error: "Error interno del servidor" })
})

export default app
