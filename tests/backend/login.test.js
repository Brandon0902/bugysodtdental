const request = require('supertest');

const mockQuery = jest.fn();

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    query: mockQuery,
  })),
}));

const { app } = require('../../server');

describe('POST /api/login', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('retorna 400 si falta email o password', async () => {
    const response = await request(app).post('/api/login').send({ email: 'admin@bugsoft.com' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('obligatorios');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('retorna 401 si las credenciales son inválidas', async () => {
    mockQuery.mockResolvedValueOnce([[]]);

    const response = await request(app).post('/api/login').send({
      email: 'admin@bugsoft.com',
      password: 'incorrecta',
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Credenciales inválidas');
  });

  it('retorna 200 y el usuario si las credenciales son correctas', async () => {
    mockQuery.mockResolvedValueOnce([
      [{ email: 'admin@bugsoft.com', role: 'Administrador', name: 'Admin Principal' }],
    ]);

    const response = await request(app).post('/api/login').send({
      email: 'admin@bugsoft.com',
      password: '123456',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      email: 'admin@bugsoft.com',
      role: 'Administrador',
      name: 'Admin Principal',
    });
  });
});
