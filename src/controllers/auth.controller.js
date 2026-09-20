import { prisma } from "../db.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export const registro = async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "nombre, email y password son obligatorios" })
    }

    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) return res.status(400).json({ error: "Email ya registrado" })

    const hash = await bcrypt.hash(password, 10)
    const usuario = await prisma.usuario.create({
      data: { nombre, email, password: hash, rol: rol || "usuario" }
    })
    res.status(201).json({ id: usuario.id, nombre: usuario.nombre, rol: usuario.rol })
  } catch (err) { 
    next(err) }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "email y password son obligatorios" })
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) return res.status(401).json({ error: "Credenciales inválidas" })

    const valido = await bcrypt.compare(password, usuario.password)
    if (!valido) return res.status(401).json({ error: "Credenciales inválidas" })

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    )
    res.json({ token })
  } catch (err) { next(err) }
}