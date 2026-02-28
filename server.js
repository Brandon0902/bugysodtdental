const path = require("path");
const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3307),
  database: process.env.DB_DATABASE || "reservaciones_qr",
  user: process.env.DB_USERNAME || "usuario_app",
  password: process.env.DB_PASSWORD || "PasswordApp",
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(80) NOT NULL,
      name VARCHAR(120) NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR(80) PRIMARY KEY,
      patient VARCHAR(120) NOT NULL,
      phone VARCHAR(80) NOT NULL,
      date DATE NOT NULL,
      time VARCHAR(10) NOT NULL,
      reason VARCHAR(200) NOT NULL,
      doctor VARCHAR(120) NOT NULL,
      notes TEXT,
      whatsapp BOOLEAN DEFAULT FALSE,
      status VARCHAR(40) DEFAULT 'Programada',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(
    `
    INSERT INTO users (email, password, role, name)
    VALUES
      ('admin@bugsoft.com', '123456', 'Administrador', 'Admin Principal'),
      ('recep@bugsoft.com', '123456', 'Recepcionista', 'Laura Recepción'),
      ('dentista@bugsoft.com', '123456', 'Dentista', 'Dr. Dentista')
    ON CONFLICT (email) DO NOTHING;
  `
  );
}

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Correo y contraseña son obligatorios." });
  }

  const result = await pool.query(
    "SELECT email, role, name FROM users WHERE LOWER(email) = LOWER($1) AND password = $2 LIMIT 1",
    [email, password]
  );

  if (!result.rows.length) {
    return res.status(401).json({ message: "Credenciales inválidas." });
  }

  return res.json(result.rows[0]);
});

app.get("/api/appointments", async (_req, res) => {
  const result = await pool.query(
    "SELECT id, patient, phone, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, reason, doctor, notes, whatsapp, status FROM appointments ORDER BY date, time"
  );

  res.json(result.rows);
});

app.post("/api/appointments", async (req, res) => {
  const { id, patient, phone, date, time, reason, doctor, notes, whatsapp, status } = req.body;

  if (!id || !patient || !phone || !date || !time || !reason || !doctor) {
    return res.status(400).json({ message: "Faltan campos obligatorios de la cita." });
  }

  const result = await pool.query(
    `
    INSERT INTO appointments (id, patient, phone, date, time, reason, doctor, notes, whatsapp, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING id, patient, phone, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, reason, doctor, notes, whatsapp, status
    `,
    [id, patient, phone, date, time, reason, doctor, notes || "", Boolean(whatsapp), status || "Programada"]
  );

  res.status(201).json(result.rows[0]);
});

app.put("/api/appointments/:id", async (req, res) => {
  const { id } = req.params;
  const { patient, phone, date, time, reason, doctor, notes, whatsapp, status } = req.body;

  const result = await pool.query(
    `
    UPDATE appointments
    SET patient = $1,
        phone = $2,
        date = $3,
        time = $4,
        reason = $5,
        doctor = $6,
        notes = $7,
        whatsapp = $8,
        status = $9
    WHERE id = $10
    RETURNING id, patient, phone, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, reason, doctor, notes, whatsapp, status
    `,
    [patient, phone, date, time, reason, doctor, notes || "", Boolean(whatsapp), status || "Programada", id]
  );

  if (!result.rows.length) {
    return res.status(404).json({ message: "Cita no encontrada." });
  }

  return res.json(result.rows[0]);
});

app.patch("/api/appointments/:id/cancel", async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `
    UPDATE appointments
    SET status = 'Cancelada'
    WHERE id = $1
    RETURNING id, patient, phone, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, reason, doctor, notes, whatsapp, status
    `,
    [id]
  );

  if (!result.rows.length) {
    return res.status(404).json({ message: "Cita no encontrada." });
  }

  return res.json(result.rows[0]);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Error interno del servidor." });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor listo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo inicializar la base de datos:", error.message);
    process.exit(1);
  });
