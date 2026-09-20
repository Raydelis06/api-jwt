import request from 'supertest'
import app from '../src/app.js'
import { prisma } from '../src/db.js'
import bcrypt from 'bcryptjs'

const timestamp = Date.now()
const password = '123456'

let usuario, admin, otroUsuario
let tokenUsuario, tokenAdmin
let tareaUsuarioId, tareaOtroId

beforeAll(async () => {
  const hash = await bcrypt.hash(password, 10)

  usuario = await prisma.usuario.create({
    data: { nombre: 'Usuario V2', email: `v2.usuario.${timestamp}@test.com`, password: hash, rol: 'usuario' }
  })
  admin = await prisma.usuario.create({
    data: { nombre: 'Admin V2', email: `v2.admin.${timestamp}@test.com`, password: hash, rol: 'admin' }
  })
  otroUsuario = await prisma.usuario.create({
    data: { nombre: 'Otro Usuario V2', email: `v2.otro.${timestamp}@test.com`, password: hash, rol: 'usuario' }
  })

  const loginUsuario = await request(app).post('/auth/login').send({ email: usuario.email, password })
  tokenUsuario = loginUsuario.body.token

  const loginAdmin = await request(app).post('/auth/login').send({ email: admin.email, password })
  tokenAdmin = loginAdmin.body.token

  const tareaUsuario = await prisma.tarea.create({ data: { titulo: 'Tarea de usuario', usuarioId: usuario.id } })
  tareaUsuarioId = tareaUsuario.id

  const tareaOtro = await prisma.tarea.create({ data: { titulo: 'Tarea de otro usuario', usuarioId: otroUsuario.id } })
  tareaOtroId = tareaOtro.id
})

afterAll(async () => {
  await prisma.tarea.deleteMany({ where: { usuarioId: { in: [usuario.id, admin.id, otroUsuario.id] } } })
  await prisma.usuario.deleteMany({ where: { id: { in: [usuario.id, admin.id, otroUsuario.id] } } })
  await prisma.$disconnect()
})

describe('GET /v2/tareas', () => {
  it('debería rechazar la petición sin token', async () => {
    const res = await request(app).get('/v2/tareas')
    expect(res.status).toBe(401)
  })

  it('debería rechazar un token inválido', async () => {
    const res = await request(app)
      .get('/v2/tareas')
      .set('Authorization', 'Bearer tokenfalso')

    expect(res.status).toBe(401)
  })

  it('debería devolver solo las tareas del usuario normal', async () => {
    const res = await request(app)
      .get('/v2/tareas')
      .set('Authorization', `Bearer ${tokenUsuario}`)

    expect(res.status).toBe(200)
    expect(res.body.every(t => t.usuarioId === usuario.id)).toBe(true)
  })

  it('debería devolver todas las tareas para el admin', async () => {
    const res = await request(app)
      .get('/v2/tareas')
      .set('Authorization', `Bearer ${tokenAdmin}`)

    expect(res.status).toBe(200)
    const ids = res.body.map(t => t.id)
    expect(ids).toEqual(expect.arrayContaining([tareaUsuarioId, tareaOtroId]))
  })
})

describe('DELETE /v2/tareas/:id', () => {
  it('debería permitir al admin eliminar cualquier tarea', async () => {
    const tarea = await prisma.tarea.create({ data: { titulo: 'Para borrar por admin', usuarioId: otroUsuario.id } })

    const res = await request(app)
      .delete(`/v2/tareas/${tarea.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)

    expect(res.status).toBe(200)
  })

  it('debería permitir al usuario eliminar su propia tarea', async () => {
    const tarea = await prisma.tarea.create({ data: { titulo: 'Para borrar por su dueño', usuarioId: usuario.id } })

    const res = await request(app)
      .delete(`/v2/tareas/${tarea.id}`)
      .set('Authorization', `Bearer ${tokenUsuario}`)

    expect(res.status).toBe(200)
  })

  it('debería rechazar que un usuario elimine la tarea de otro', async () => {
    const res = await request(app)
      .delete(`/v2/tareas/${tareaOtroId}`)
      .set('Authorization', `Bearer ${tokenUsuario}`)

    expect(res.status).toBe(403)
  })

  it('debería rechazar la eliminación sin token', async () => {
    const res = await request(app).delete(`/v2/tareas/${tareaOtroId}`)
    expect(res.status).toBe(401)
  })
})
