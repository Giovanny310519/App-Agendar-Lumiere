import React, { useEffect, useMemo, useState } from "react";
// Iconos simples para evitar dependencias externas rotas
const CalendarDays = () => <span>📅</span>;
const Clock3 = () => <span>⏰</span>;
const Scissors = () => <span>✂️</span>;
const Users = () => <span>👥</span>;
const Database = () => <span>🗄️</span>;
const Layers3 = () => <span>🧱</span>;
const CheckCircle2 = () => <span>✅</span>;
const XCircle = () => <span>❌</span>;
const Search = () => <span>🔎</span>;
const PlusCircle = () => <span>➕</span>;
const Trash2 = () => <span>🗑️</span>;
const RotateCcw = () => <span>🔄</span>;

const SERVICES = [
  { id: "s1", name: "Corte de cabello", duration: 45, price: 35000 },
  { id: "s2", name: "Cepillado", duration: 50, price: 45000 },
  { id: "s3", name: "Coloración", duration: 120, price: 180000 },
  { id: "s4", name: "Manicure", duration: 60, price: 40000 },
  { id: "s5", name: "Pedicure", duration: 60, price: 45000 },
  { id: "s6", name: "Peinado de evento", duration: 75, price: 70000 },
];

const STYLISTS = [
  { id: "p1", name: "Laura Gómez", specialties: ["Corte de cabello", "Cepillado", "Peinado de evento"] },
  { id: "p2", name: "Camila Torres", specialties: ["Coloración", "Corte de cabello", "Cepillado"] },
  { id: "p3", name: "Andrés Ruiz", specialties: ["Corte de cabello", "Peinado de evento"] },
  { id: "p4", name: "Sofía Pérez", specialties: ["Manicure", "Pedicure"] },
];

const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const ARCH = {
  frontend: [
    "React + Tailwind para una interfaz rápida y mantenible.",
    "Validación del formulario en tiempo real.",
    "Persistencia local para demo y sincronización con API real después.",
  ],
  backend: [
    "API REST para crear, consultar, actualizar y cancelar citas.",
    "Reglas de negocio: disponibilidad, duración por servicio y control de conflictos.",
    "Autenticación para administradores y panel de gestión.",
  ],
  database: [
    "Modelo relacional con tablas de clientes, servicios, estilistas y citas.",
    "Índices por fecha, estilista y estado para escalar consultas.",
    "Posibilidad de mover a PostgreSQL, MySQL o una base gestionada en la nube.",
  ],
};

const initialAppointments = [
  {
    id: "a1",
    customerName: "María López",
    phone: "3001234567",
    serviceId: "s1",
    stylistId: "p1",
    date: todayISO(),
    time: "10:00",
    status: "Confirmada",
    notes: "Retocar puntas",
  },
  {
    id: "a2",
    customerName: "Daniela Ríos",
    phone: "3015558899",
    serviceId: "s3",
    stylistId: "p2",
    date: addDaysISO(1),
    time: "14:00",
    status: "Pendiente",
    notes: "Tono castaño oscuro",
  },
];

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

function moneyCOP(value) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function SalonAppointmentApp() {
  const [appointments, setAppointments] = useState([]);
  const [selectedService, setSelectedService] = useState(SERVICES[0].id);
  const [selectedStylist, setSelectedStylist] = useState(STYLISTS[0].id);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(TIME_SLOTS[0]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState({ type: "info", text: "" });

  // Cargar citas desde el backend en lugar de localStorage
useEffect(() => {
  const fetchAppointments = async () => {
    try {
      const res = await fetch("https://app-agendar-lumiere.onrender.com/appointments");
      const data = await res.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error cargando citas desde backend:", error);
      // fallback a localStorage si el backend falla
      const cached = localStorage.getItem("salon-appointments-v1");
      if (cached) {
        setAppointments(JSON.parse(cached));
      }
    }
  };

  fetchAppointments();
}, []);

  useEffect(() => {
    if (appointments.length) {
      localStorage.setItem("salon-appointments-v1", JSON.stringify(appointments));
    }
  }, [appointments]);

  const selectedServiceObj = SERVICES.find((s) => s.id === selectedService);
  const selectedStylistObj = STYLISTS.find((p) => p.id === selectedStylist);

  const availableStylists = useMemo(() => {
    return STYLISTS.filter((stylist) => stylist.specialties.includes(selectedServiceObj?.name));
  }, [selectedServiceObj]);

  useEffect(() => {
    if (availableStylists.length && !availableStylists.some((s) => s.id === selectedStylist)) {
      setSelectedStylist(availableStylists[0].id);
    }
  }, [availableStylists, selectedStylist]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => (statusFilter === "Todas" ? true : a.status === statusFilter))
      .filter((a) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        const serviceName = SERVICES.find((s) => s.id === a.serviceId)?.name || "";
        const stylistName = STYLISTS.find((p) => p.id === a.stylistId)?.name || "";
        return [a.customerName, a.phone, serviceName, stylistName, a.date, a.time, a.status]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [appointments, statusFilter, search]);

  const stats = useMemo(() => {
    const confirmed = appointments.filter((a) => a.status === "Confirmada").length;
    const pending = appointments.filter((a) => a.status === "Pendiente").length;
    const revenue = appointments
      .filter((a) => a.status !== "Cancelada")
      .reduce((acc, a) => acc + (SERVICES.find((s) => s.id === a.serviceId)?.price || 0), 0);
    return { total: appointments.length, confirmed, pending, revenue };
  }, [appointments]);

  const slotBusy = (d, t, stylistId) =>
    appointments.some((a) => a.date === d && a.time === t && a.stylistId === stylistId && a.status !== "Cancelada");

  // URL de tu backend en Render
const API_URL = "https://app-agendar-lumiere.onrender.com";

const createAppointment = async (e) => {
  e.preventDefault();

  if (!customerName.trim() || !phone.trim()) {
    setMessage({ type: "error", text: "Completa el nombre y el teléfono." });
    return;
  }

  try {
    const response = await fetch(`${API_URL}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serviceId: selectedService,
        staffId: selectedStylist,
        date,
        time,
        clientName: customerName,
        clientEmail: "",
        clientPhone: phone,
      }),
    });

    if (!response.ok) {
      throw new Error("No se pudo guardar la cita");
    }

    const newAppointment = await response.json();

    setAppointments((prev) => [newAppointment, ...prev]);
    setCustomerName("");
    setPhone("");
    setNotes("");

    setMessage({ type: "success", text: "Cita creada correctamente en el backend 🚀" });
  } catch (error) {
    console.error(error);
    setMessage({ type: "error", text: "Error conectando con el servidor" });
  }
};

    setAppointments((prev) => [newAppointment, ...prev]);
    setCustomerName("");
    setPhone("");
    setNotes("");
    setMessage({ type: "success", text: "Cita creada correctamente." });
  };

  const updateStatus = (id, nextStatus) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a)));
    setMessage({ type: "success", text: `La cita fue marcada como ${nextStatus.toLowerCase()}.` });
  };

  const deleteAppointment = (id) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    setMessage({ type: "info", text: "Cita eliminada." });
  };

  const resetDemo = () => {
    setAppointments(initialAppointments);
    localStorage.setItem("salon-appointments-v1", JSON.stringify(initialAppointments));
    setMessage({ type: "info", text: "Datos de ejemplo restaurados." });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-pink-700">
              <Scissors className="h-4 w-4" />
              Salón de belleza | Agendamiento de citas
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Aplicación escalable para reservas y gestión de citas</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
              Arquitectura separada en frontend, backend y base de datos, con una interfaz funcional para agendar, consultar y administrar citas.
            </p>
          </div>
          <button
            onClick={resetDemo}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar demo
          </button>
        </header>

        {message.text && (
          <div
            className={classNames(
              "mb-6 rounded-2xl border p-4 text-sm",
              message.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
              message.type === "error" && "border-red-200 bg-red-50 text-red-700",
              message.type === "info" && "border-sky-200 bg-sky-50 text-sky-700"
            )}
          >
            {message.text}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Total citas" value={stats.total} />
              <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Confirmadas" value={stats.confirmed} />
              <StatCard icon={<Clock3 className="h-5 w-5" />} label="Pendientes" value={stats.pending} />
              <StatCard icon={<Database className="h-5 w-5" />} label="Ingresos estimados" value={moneyCOP(stats.revenue)} compact />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card title="Nueva cita" icon={<PlusCircle className="h-5 w-5" />}>
                <form onSubmit={createAppointment} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nombre del cliente">
                      <input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={inputClass}
                        placeholder="Ej. Juan Pérez"
                      />
                    </Field>
                    <Field label="Teléfono">
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={inputClass}
                        placeholder="Ej. 3001234567"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Servicio">
                      <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className={inputClass}>
                        {SERVICES.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} - {moneyCOP(service.price)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Profesional">
                      <select value={selectedStylist} onChange={(e) => setSelectedStylist(e.target.value)} className={inputClass}>
                        {availableStylists.map((stylist) => (
                          <option key={stylist.id} value={stylist.id}>
                            {stylist.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Fecha">
                      <input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Hora">
                      <select value={time} onChange={(e) => setTime(e.target.value)} className={inputClass}>
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot} disabled={slotBusy(date, slot, selectedStylist)}>
                            {slot} {slotBusy(date, slot, selectedStylist) ? "(ocupado)" : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Notas">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className={classNames(inputClass, "min-h-28")}
                      placeholder="Preferencias, observaciones, color, estilo, etc."
                    />
                  </Field>

                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-800">Resumen</p>
                    <p>Servicio: {selectedServiceObj?.name}</p>
                    <p>Duración estimada: {selectedServiceObj?.duration} min</p>
                    <p>Precio: {moneyCOP(selectedServiceObj?.price || 0)}</p>
                    <p>Profesional: {selectedStylistObj?.name}</p>
                  </div>

                  <button className="w-full rounded-2xl bg-pink-600 px-4 py-3 font-medium text-white transition hover:bg-pink-700">
                    Agendar cita
                  </button>
                </form>
              </Card>

              <Card title="Citas del día y gestión" icon={<Layers3 className="h-5 w-5" />}>
                <div className="mb-4 flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} className={classNames(inputClass, "pl-10")} placeholder="Buscar cliente, servicio, fecha..." />
                  </div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
                    <option>Todas</option>
                    <option>Pendiente</option>
                    <option>Confirmada</option>
                    <option>Cancelada</option>
                  </select>
                </div>

                <div className="space-y-3 max-h-[680px] overflow-auto pr-1">
                  {filteredAppointments.length === 0 ? (
                    <EmptyState />
                  ) : (
                    filteredAppointments.map((a) => {
                      const service = SERVICES.find((s) => s.id === a.serviceId);
                      const stylist = STYLISTS.find((s) => s.id === a.stylistId);
                      return (
                        <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{a.customerName}</h3>
                                <StatusPill status={a.status} />
                              </div>
                              <p className="text-sm text-slate-600">{a.phone}</p>
                              <p className="mt-1 text-sm text-slate-700">
                                {service?.name} · {moneyCOP(service?.price || 0)}
                              </p>
                              <p className="text-sm text-slate-700">
                                {stylist?.name} · {a.date} · {a.time}
                              </p>
                              {a.notes ? <p className="mt-2 text-sm text-slate-500">Notas: {a.notes}</p> : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {a.status !== "Confirmada" && (
                                <button onClick={() => updateStatus(a.id, "Confirmada")} className={actionBtnClass}>
                                  Confirmar
                                </button>
                              )}
                              {a.status !== "Cancelada" && (
                                <button onClick={() => updateStatus(a.id, "Cancelada")} className={classNames(actionBtnClass, "bg-red-50 text-red-700 hover:bg-red-100")}>
                                  Cancelar
                                </button>
                              )}
                              <button onClick={() => deleteAppointment(a.id)} className={classNames(actionBtnClass, "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card title="Arquitectura propuesta" icon={<Layers3 className="h-5 w-5" />}>
              <ArchitectureBlock title="Frontend" icon={<Users className="h-4 w-4" />} items={ARCH.frontend} />
              <ArchitectureBlock title="Backend" icon={<Scissors className="h-4 w-4" />} items={ARCH.backend} />
              <ArchitectureBlock title="Base de datos" icon={<Database className="h-4 w-4" />} items={ARCH.database} />
            </Card>

            <Card title="Modelo de datos" icon={<Database className="h-5 w-5" />}>
              <div className="space-y-3 text-sm text-slate-700">
                <DataRow table="clients" cols="id, name, phone, email, created_at" />
                <DataRow table="services" cols="id, name, duration_minutes, price, active" />
                <DataRow table="stylists" cols="id, name, specialty, active" />
                <DataRow table="appointments" cols="id, client_id, service_id, stylist_id, date, time, status, notes" />
                <DataRow table="appointment_logs" cols="id, appointment_id, action, created_at" />
              </div>
            </Card>

            <Card title="API REST sugerida" icon={<CheckCircle2 className="h-5 w-5" />}>
              <div className="space-y-2 text-sm text-slate-700">
                <Endpoint method="GET" path="/api/services" />
                <Endpoint method="GET" path="/api/stylists" />
                <Endpoint method="GET" path="/api/appointments?date=YYYY-MM-DD" />
                <Endpoint method="POST" path="/api/appointments" />
                <Endpoint method="PATCH" path="/api/appointments/:id" />
                <Endpoint method="DELETE" path="/api/appointments/:id" />
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-2xl bg-slate-900 p-2 text-white">{icon}</div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, compact = false }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className={classNames("mt-1 font-bold tracking-tight", compact ? "text-lg" : "text-3xl")}>{value}</p>
        </div>
        <div className="rounded-2xl bg-pink-50 p-2 text-pink-700">{icon}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function ArchitectureBlock({ title, icon, items }) {
  return (
    <div className="mb-4 rounded-2xl bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-xl bg-white p-2 text-slate-900 shadow-sm">{icon}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-pink-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DataRow({ table, cols }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <p className="font-medium text-slate-900">{table}</p>
      <p className="text-xs text-slate-500">{cols}</p>
    </div>
  );
}

function Endpoint({ method, path }) {
  const colorClass =
    method === "GET"
      ? "bg-emerald-100 text-emerald-700"
      : method === "POST"
      ? "bg-blue-100 text-blue-700"
      : method === "PATCH"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
      <span className={classNames("rounded-xl px-2 py-1 text-xs font-bold", colorClass)}>{method}</span>
      <span className="text-sm text-slate-700">{path}</span>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    Pendiente: "bg-amber-100 text-amber-700",
    Confirmada: "bg-emerald-100 text-emerald-700",
    Cancelada: "bg-red-100 text-red-700",
  };
  return <span className={classNames("rounded-full px-2.5 py-1 text-xs font-semibold", styles[status] || "bg-slate-100 text-slate-700")}>{status}</span>;
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      <XCircle className="mx-auto mb-2 h-6 w-6 text-slate-400" />
      No hay citas que coincidan con el filtro.
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-100";
const actionBtnClass =
  "inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800";
