const request = require('supertest');

const mockQuery = jest.fn();

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    query: mockQuery,
  })),
}));

const { app } = require('../../server');

describe('Appointments API', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('GET /api/appointments retorna 200 y un arreglo', async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 'a-1', patient: 'Luis', reason: 'Limpieza' }]]);

    const response = await request(app).get('/api/appointments');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].id).toBe('a-1');
  });

  it('POST /api/appointments retorna 400 si faltan campos obligatorios', async () => {
    const response = await request(app).post('/api/appointments').send({ id: 'a-1', patient: 'Luis' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Faltan campos');
  });

  it('POST /api/appointments retorna 201 y el registro insertado', async () => {
    const payload = {
      id: 'a-2',
      patient: 'Ana',
      phone: '555-1111',
      date: '2026-02-26',
      time: '10:00',
      reason: 'Revisión',
      doctor: 'Dra. Ruiz',
    };

    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ ...payload, notes: '', whatsapp: 0, status: 'Programada' }]]);

    const response = await request(app).post('/api/appointments').send(payload);

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(payload.id);
    expect(response.body.patient).toBe(payload.patient);
  });

  it('POST /api/appointments retorna 409 para id duplicado', async () => {
    const payload = {
      id: 'a-2',
      patient: 'Ana',
      phone: '555-1111',
      date: '2026-02-26',
      time: '10:00',
      reason: 'Revisión',
      doctor: 'Dra. Ruiz',
    };

    const duplicateError = new Error('duplicate');
    duplicateError.code = 'ER_DUP_ENTRY';
    mockQuery.mockRejectedValueOnce(duplicateError);

    const response = await request(app).post('/api/appointments').send(payload);

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('Ya existe una cita');
  });

  it('PUT /api/appointments/:id retorna 404 si no existe', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const response = await request(app)
      .put('/api/appointments/no-existe')
      .send({ patient: 'P', phone: '1', date: '2026-02-26', time: '10:00', reason: 'R', doctor: 'D' });

    expect(response.status).toBe(404);
  });

  it('PUT /api/appointments/:id retorna 200 y registro actualizado', async () => {
    const updated = {
      id: 'a-3',
      patient: 'Paciente Editado',
      phone: '555-2222',
      date: '2026-02-27',
      time: '11:00',
      reason: 'Control',
      doctor: 'Dr. Pérez',
      notes: '',
      whatsapp: 1,
      status: 'Programada',
    };

    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[updated]]);

    const response = await request(app).put('/api/appointments/a-3').send(updated);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updated);
  });

  it('PATCH /api/appointments/:id/cancel retorna 404 si no existe', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const response = await request(app).patch('/api/appointments/no-existe/cancel');

    expect(response.status).toBe(404);
  });

  it('PATCH /api/appointments/:id/cancel retorna 200 y registro cancelado', async () => {
    const canceled = {
      id: 'a-4',
      patient: 'Luis',
      phone: '555-1111',
      date: '2026-02-27',
      time: '12:00',
      reason: 'Control',
      doctor: 'Dra. Ruiz',
      notes: '',
      whatsapp: 0,
      status: 'Cancelada',
    };

    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[canceled]]);

    const response = await request(app).patch('/api/appointments/a-4/cancel');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Cancelada');
  });
});
