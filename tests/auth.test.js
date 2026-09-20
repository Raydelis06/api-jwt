import request from 'supertest'
import app from '../src/app.js'
import { prisma } from '../src/db.js'

const timestamp = Date.now()
const emailSuccess = `test.success.${timestamp}@test.com`
const emailDuplicate = `test.duplicate.${timestamp}@test.com`
const emailSinPassword = `test.sinpass.${timestamp}@test.com`
const emailLogin = `test.login.${timestamp}@test.com`
const emailNoExiste = `test.noexiste.${timestamp}@test.com`
const passwordLogin = '123456'

const createdUserIds = []

afterAll(async () => {
  if (createdUserIds.length) {
    await prisma.usuario.deleteMany({ where: { id: { in: createdUserIds } } })
  }
  await prisma.$disconnect()
})

describe('POST /auth/registro', () => {
  it('debería registrar un usuario exitosamente', async () => {
    const res = await request(app)
      .post('/auth/registro')
      .send({
        nombre: 'Test User',
        email: emailSuccess,
        password: '123456',
        rol: 'usuario'
      })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body).not.toHaveProperty('password')

    createdUserIds.push(res.body.id)
  })

  it('debería rechazar un email duplicado', async () => {
    const primero = await request(app)
      .post('/auth/registro')
      .send({
        nombre: 'Usuario Original',
        email: emailDuplicate,
        password: '123456',
        rol: 'usuario'
      })
    createdUserIds.push(primero.body.id)

    const res = await request(app)
      .post('/auth/registro')
      .send({
        nombre: 'Usuario Repetido',
        email: emailDuplicate,
        password: '654321',
        rol: 'usuario'
      })

    expect(res.status).toBe(400)
  })

  it('debería rechazar el registro sin email', async () => {
    const res = await request(app)
      .post('/auth/registro')
      .send({ nombre: 'Sin Email', password: '123456' })

    expect(res.status).toBe(400)
  })

  it('debería rechazar el registro sin password', async () => {
    const res = await request(app)
      .post('/auth/registro')
      .send({ nombre: 'Sin Password', email: emailSinPassword })

    expect(res.status).toBe(400)
  })
})

describe('POST /auth/login', () => {
  beforeAll(async () => {
    const registro = await request(app)
      .post('/auth/registro')
      .send({
        nombre: 'Login User',
        email: emailLogin,
        password: passwordLogin,
        rol: 'usuario'
      })
    createdUserIds.push(registro.body.id)
  })

  it('debería iniciar sesión exitosamente', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: emailLogin, password: passwordLogin })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  it('debería rechazar una password incorrecta', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: emailLogin, password: 'incorrecta' })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('debería rechazar un email que no existe', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: emailNoExiste, password: '123456' })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('debería rechazar credenciales vacías', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({})

    expect(res.status).toBe(400)
  })
})
