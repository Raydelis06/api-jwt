import { prisma } from "../../db.js"

export const getTareasPublicas = async (req, res, next) => {
  try {
    const tareas = await prisma.tarea.findMany()
    res.json(tareas)
  } catch (err) { next(err) }
}

export const createTareaPublica = async (req, res, next) => {
  try {
    const { titulo, usuarioId } = req.body

    if (!titulo || !usuarioId) {
      return res.status(400).json({ error: "titulo y usuarioId son obligatorios" })
    }
    
    const tarea = await prisma.tarea.create({
      data: { titulo, usuarioId }
    })
    res.status(201).json(tarea)
  } catch (err) { next(err) }
}