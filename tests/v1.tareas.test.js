import request from 'supertest'
import app from '../src/app.js'
import { prisma } from '../src/db.js'

const timestamp = Date.now()
const API_KEY = process.env.API_KEY
const createdTareaIds = []
let usuarioId

beforeAll(async () => {
  const usuario = await prisma.usuario.create({
    data: {
      nombre: 'Usuario V1',
      email: `v1.owner.${timestamp}@test.com`,
      password: 'hash-no-relevante',
      rol: 'usuario'
    }
  })
  usuarioId = usuario.id
})

afterAll(async () => {
  if (createdTareaIds.length) {
    await prisma.tarea.deleteMany({ where: { id: { in: createdTareaIds } } })
  }
  await prisma.usuario.delete({ where: { id: usuarioId } })
  await prisma.$disconnect()
})

describe('GET /v1/tareas', () => {
  it('debería responder con la lista de tareas usando una API Key válida', async () => {
    const res = await request(app)
      .get('/v1/tareas')
      .set('x-api-key', API_KEY)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('debería rechazar la petición sin API Key', async () => {
    const res = await request(app).get('/v1/tareas')

    expect(res.status).toBe(401)
  })

  it('debería rechazar una API Key incorrecta', async () => {
    const res = await request(app)
      .get('/v1/tareas')
      .set('x-api-key', 'clave-incorrecta')

    expect(res.status).toBe(401)
  })
})

describe('POST /v1/tareas', () => {
  it('debería crear una tarea exitosamente', async () => {
    const res = await request(app)
      .post('/v1/tareas')
      .set('x-api-key', API_KEY)
      .send({ titulo: 'Tarea de prueba v1', usuarioId })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')

    createdTareaIds.push(res.body.id)
  })

  it('debería rechazar la creación sin título', async () => {
    const res = await request(app)
      .post('/v1/tareas')
      .set('x-api-key', API_KEY)
      .send({ usuarioId })

    expect(res.status).toBe(400)
  })

  it('debería rechazar la creación sin API Key', async () => {
    const res = await request(app)
      .post('/v1/tareas')
      .send({ titulo: 'Tarea sin key', usuarioId })

    expect(res.status).toBe(401)
  })
})
