import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB local o Atlas
mongoose
  .connect("mongodb://127.0.0.1:27017/lumiere")
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error MongoDB:", err.message));

const AppointmentSchema = new mongoose.Schema(
  {
    serviceId: { type: String, required: true },
    staffId: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String, required: true },
    status: { type: String, default: "confirmed" },
    createdAt: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  },
  { versionKey: false }
);

const Appointment = mongoose.model("Appointment", AppointmentSchema);

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Backend Lumière funcionando" });
});

app.get("/appointments", async (req, res) => {
  const items = await Appointment.find().sort({ createdAt: -1 });
  res.json(items);
});

app.post("/appointments", async (req, res) => {
  try {
    const item = await Appointment.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: "No se pudo crear la cita", error: error.message });
  }
});

app.patch("/appointments/:id/cancel", async (req, res) => {
  try {
    const item = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Cita no encontrada" });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: "No se pudo cancelar", error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});