const path = require("path");
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3307),
  database: process.env.DB_DATABASE || "bugysodtdental",
  user: process.env.DB_USERNAME || "usuario_app",
  password: process.env.DB_PASSWORD || "PasswordApp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(80) NOT NULL,
      name VARCHAR(120) NOT NULL
    ) ENGINE=InnoDB;
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
      whatsapp TINYINT(1) DEFAULT 0,
      status VARCHAR(40) DEFAULT 'Programada',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await pool.query(`
    INSERT IGNORE INTO users (email, password, role, name)
    VALUES
      ('admin@bugsoft.com', '123456', 'Administrador', 'Admin Principal'),
      ('recep@bugsoft.com', '123456', 'Recepcionista', 'Laura Recepción'),
      ('dentista@bugsoft.com', '123456', 'Dentista', 'Dr. Dentista');
  `);
}

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Correo y contraseña son obligatorios." });
    }

    const [rows] = await pool.query(
      "SELECT email, role, name FROM users WHERE LOWER(email) = LOWER(?) AND password = ? LIMIT 1",
      [email, password]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.get("/api/appointments", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id, patient, phone,
        DATE_FORMAT(date, '%Y-%m-%d') AS date,
        time, reason, doctor, notes,
        whatsapp, status
      FROM appointments
      ORDER BY date, time;
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.post("/api/appointments", async (req, res) => {
  try {
    const { id, patient, phone, date, time, reason, doctor, notes, whatsapp, status } = req.body;

    if (!id || !patient || !phone || !date || !time || !reason || !doctor) {
      return res.status(400).json({ message: "Faltan campos obligatorios de la cita." });
    }

    await pool.query(
      `
      INSERT INTO appointments (id, patient, phone, date, time, reason, doctor, notes, whatsapp, status)
      VALUES (?,?,?,?,?,?,?,?,?,?)
      `,
      [id, patient, phone, date, time, reason, doctor, notes || "", whatsapp ? 1 : 0, status || "Programada"]
    );

    const [rows] = await pool.query(
      `
      SELECT
        id, patient, phone,
        DATE_FORMAT(date, '%Y-%m-%d') AS date,
        time, reason, doctor, notes,
        whatsapp, status
      FROM appointments
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Ya existe una cita con ese id." });
    }
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.put("/api/appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { patient, phone, date, time, reason, doctor, notes, whatsapp, status } = req.body;

    const [result] = await pool.query(
      `
      UPDATE appointments
      SET patient = ?,
          phone = ?,
          date = ?,
          time = ?,
          reason = ?,
          doctor = ?,
          notes = ?,
          whatsapp = ?,
          status = ?
      WHERE id = ?
      `,
      [patient, phone, date, time, reason, doctor, notes || "", whatsapp ? 1 : 0, status || "Programada", id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Cita no encontrada." });
    }

    const [rows] = await pool.query(
      `
      SELECT
        id, patient, phone,
        DATE_FORMAT(date, '%Y-%m-%d') AS date,
        time, reason, doctor, notes,
        whatsapp, status
      FROM appointments
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.patch("/api/appointments/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
      UPDATE appointments
      SET status = 'Cancelada'
      WHERE id = ?
      `,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Cita no encontrada." });
    }

    const [rows] = await pool.query(
      `
      SELECT
        id, patient, phone,
        DATE_FORMAT(date, '%Y-%m-%d') AS date,
        time, reason, doctor, notes,
        whatsapp, status
      FROM appointments
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => console.log(`Servidor listo en http://localhost:${PORT}`));
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("No se pudo inicializar la base de datos:", error.message);
    process.exit(1);
  });
}

module.exports = { app, pool, initializeDatabase, startServer };
