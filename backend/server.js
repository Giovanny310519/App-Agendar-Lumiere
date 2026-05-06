// Importación de librerías necesarias
import express from "express";     // Framework para crear el servidor
import cors from "cors";           // Permite peticiones desde el frontend
import mongoose from "mongoose";   // ODM para MongoDB

// Inicializar la app
const app = express();

// Middlewares
app.use(cors());           // Permitir acceso desde cualquier origen (frontend)
app.use(express.json());   // Permitir recibir JSON en las peticiones

// =========================
// 🔌 CONEXIÓN A MONGODB
// =========================

// ⚠️ IMPORTANTE:
// NO dejes la URL de Mongo quemada en el código (eso es nivel "me hackean en 2 días")
// Usa variables de entorno en Render

const MONGO_URI = process.env.MONGO_URI;

// Conexión a MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error MongoDB:", err.message));

// =========================
// 📦 MODELO DE DATOS
// =========================

// Esquema de citas
const AppointmentSchema = new mongoose.Schema({
  serviceId: String,
  staffId: String,
  date: String,
  time: String,
  clientName: String,
  clientEmail: String,
  clientPhone: String,

  // Estado de la cita (por defecto confirmada)
  status: {
    type: String,
    default: "confirmed"
  },

  // Fecha de creación automática
  createdAt: {
    type: String,
    default: () => new Date().toISOString().slice(0, 10)
  }
});

// Crear el modelo
const Appointment = mongoose.model("Appointment", AppointmentSchema);

// =========================
// 🌐 RUTAS DEL BACKEND
// =========================

// Ruta base (para verificar que el backend funciona)
app.get("/", (req, res) => {
  res.send("🚀 Backend Lumière funcionando");
});

// Obtener todas las citas
app.get("/appointments", async (req, res) => {
  try {
    const data = await Appointment.find();
    res.json(data);
  } catch (error) {
    console.error("❌ Error al obtener citas:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Crear una nueva cita
app.post("/appointments", async (req, res) => {
  try {
    const newApt = new Appointment(req.body);

    console.log("📝 Intentando guardar:", newApt);

    await newApt.save();

    console.log("✅ Guardado exitosamente:", newApt._id);

    res.json(newApt);
  } catch (error) {
    console.error("❌ Error al guardar:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Cancelar una cita
app.patch("/appointments/:id", async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.error("❌ Error al cancelar:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// 🚀 SERVIDOR
// =========================

// Render asigna el puerto automáticamente
const PORT = process.env.PORT || 3000;

// ⚠️ IMPORTANTE:
// En Render SIEMPRE debe ser 0.0.0.0 (no inventes IPs mágicas)
app.listen(PORT, () => {
  console.log(`🔥 Servidor corriendo en puerto ${PORT}`);
});