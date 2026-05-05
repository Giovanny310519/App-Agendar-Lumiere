import { useState, useEffect, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════
   LUMIÈRE SALON — Sistema de Agendamiento de Citas
   ─────────────────────────────────────────────────────────────────
   Arquitectura en 3 Capas:
   1. CAPA DE DATOS     → Entidades y persistencia en memoria
   2. CAPA DE NEGOCIO  → Repositorio, disponibilidad, validaciones
   3. CAPA DE UI       → Componentes React por vista
   ═══════════════════════════════════════════════════════════════════ */

// ──────────────────────────────────────────────────────────────────
// 1. CAPA DE DATOS  (Data Layer / Database Entities)
// ──────────────────────────────────────────────────────────────────
const SERVICES = [
  { id:"s1", name:"Corte de Cabello",  cat:"Cabello",    dur:45,  price:45000,  emoji:"✂️",  desc:"Corte personalizado según tu tipo de rostro y estructura capilar." },
  { id:"s2", name:"Color Completo",    cat:"Color",      dur:120, price:180000, emoji:"🎨",  desc:"Coloración total con productos premium e hidratación profunda." },
  { id:"s3", name:"Balayage",          cat:"Color",      dur:180, price:250000, emoji:"✨",  desc:"Aclarado degradado de origen francés para un look natural y luminoso." },
  { id:"s4", name:"Manicure Clásica",  cat:"Uñas",       dur:45,  price:35000,  emoji:"💅",  desc:"Limpieza, modelado y esmaltado profesional." },
  { id:"s5", name:"Pedicure Spa",      cat:"Uñas",       dur:60,  price:55000,  emoji:"🦶",  desc:"Tratamiento completo con exfoliación, hidratación y esmaltado." },
  { id:"s6", name:"Tratamiento Capilar",cat:"Cabello",   dur:60,  price:80000,  emoji:"💆",  desc:"Recuperación profunda e hidratación de la fibra capilar." },
  { id:"s7", name:"Maquillaje Social", cat:"Maquillaje", dur:90,  price:120000, emoji:"💄",  desc:"Maquillaje artístico para eventos con productos de alta gama." },
  { id:"s8", name:"Cejas y Pestañas",  cat:"Facial",     dur:30,  price:45000,  emoji:"👁️", desc:"Diseño de cejas y tinte de pestañas para una mirada perfecta." },
];

const STAFF = [
  { id:"st1", name:"Valentina Ríos",  role:"Estilista Senior",       initials:"VR", bg:"#C9A96E", specialties:["s1","s2","s3","s6"], rating:4.9, reviews:248, bio:"10 años de experiencia en colorimetría y técnicas europeas de vanguardia." },
  { id:"st2", name:"Camila Torres",   role:"Colorista Especialista",  initials:"CT", bg:"#9E6B8A", specialties:["s2","s3","s6"],      rating:4.8, reviews:186, bio:"Certificada en París. Experta en balayage y tendencias internacionales de color." },
  { id:"st3", name:"Sofía Martínez",  role:"Nail Artist",             initials:"SM", bg:"#6A8FA6", specialties:["s4","s5"],           rating:4.9, reviews:312, bio:"Especialista en nail art, gel y técnicas de acrílico de alta precisión." },
  { id:"st4", name:"Andrés Gómez",    role:"Estilista & Maquillador", initials:"AG", bg:"#6A9E7E", specialties:["s1","s7","s8"],      rating:4.7, reviews:165, bio:"Formado en Bogotá, NYC y CDMX. Artista integral con visión editorial." },
];

// Datos semilla para demostración
let _apts = [
  { id:"a001", serviceId:"s1", staffId:"st1", date:"2026-05-02", time:"09:00", clientName:"María García",   clientEmail:"maria@email.com",   clientPhone:"3001234567", status:"confirmed", createdAt:"2026-04-28" },
  { id:"a002", serviceId:"s2", staffId:"st2", date:"2026-05-02", time:"10:00", clientName:"Laura Pérez",    clientEmail:"laura@email.com",   clientPhone:"3107654321", status:"confirmed", createdAt:"2026-04-29" },
  { id:"a003", serviceId:"s4", staffId:"st3", date:"2026-05-03", time:"14:00", clientName:"Ana Rodríguez",  clientEmail:"ana@email.com",     clientPhone:"3201112233", status:"confirmed", createdAt:"2026-04-29" },
  { id:"a004", serviceId:"s7", staffId:"st4", date:"2026-05-04", time:"11:00", clientName:"Juliana López",  clientEmail:"juliana@email.com", clientPhone:"3156789012", status:"confirmed", createdAt:"2026-04-30" },
  { id:"a005", serviceId:"s3", staffId:"st2", date:"2026-05-05", time:"09:30", clientName:"Paola Vargas",   clientEmail:"demo@email.com",    clientPhone:"3001112233", status:"confirmed", createdAt:"2026-04-30" },
  { id:"a006", serviceId:"s5", staffId:"st3", date:"2026-05-06", time:"15:00", clientName:"Camila Díaz",    clientEmail:"demo@email.com",    clientPhone:"3012345678", status:"cancelled", createdAt:"2026-04-30" },
];

// ──────────────────────────────────────────────────────────────────
// 2. CAPA DE NEGOCIO  (Business Logic / Service Layer)
// ──────────────────────────────────────────────────────────────────

/** Repositorio: encapsula el acceso a los datos de citas */
const AptRepo = {
  all:         ()     => [..._apts],
  byEmail:     (e)    => _apts.filter(a => a.clientEmail.toLowerCase() === e.toLowerCase()),
  byStaffDate: (s,d)  => _apts.filter(a => a.staffId===s && a.date===d && a.status!=="cancelled"),
  create: (data) => {
    const a = { ...data, id:"a"+Date.now(), status:"confirmed", createdAt:new Date().toISOString().slice(0,10) };
    _apts.push(a);
    return a;
  },
  cancel: (id) => {
    const i = _apts.findIndex(a => a.id===id);
    if (i > -1) _apts[i] = { ..._apts[i], status:"cancelled" };
    return _apts[i];
  },
};

/** Servicio de disponibilidad: calcula horarios libres evitando colisiones */
const Availability = {
  allSlots: () => {
    const slots = [];
    for (let h = 8; h <= 18; h++) {
      slots.push(`${String(h).padStart(2,"0")}:00`);
      if (h < 18) slots.push(`${String(h).padStart(2,"0")}:30`);
    }
    return slots;
  },
  get: (staffId, date, duration) => {
    if (!staffId || !date || !duration) return [];
    const booked = AptRepo.byStaffDate(staffId, date);
    return Availability.allSlots().filter(slot => {
      const [sh,sm] = slot.split(":").map(Number);
      const start = sh*60+sm, end = start+duration;
      // El salón cierra a las 7pm
      if (end > 19*60) return false;
      // Verificar colisión con citas existentes
      return !booked.some(a => {
        const svc = SERVICES.find(s => s.id===a.serviceId);
        const [ah,am] = a.time.split(":").map(Number);
        const as2 = ah*60+am, ae = as2+(svc?.dur||60);
        return start < ae && end > as2;
      });
    });
  }
};

// ──────────────────────────────────────────────────────────────────
// Helpers de presentación
// ──────────────────────────────────────────────────────────────────
const cop     = n => "$"+n.toLocaleString("es-CO");
const todayS  = () => new Date().toISOString().slice(0,10);
const fmtDate = d => {
  if (!d) return "";
  const [y,m,dy] = d.split("-");
  const ms = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${+dy} ${ms[+m-1]} ${y}`;
};
const gSvc = id => SERVICES.find(s => s.id===id);
const gStf = id => STAFF.find(s => s.id===id);

// Paleta de colores del tema
const T = {
  bg:"#FAF8F5", surf:"#FFFFFF", dark:"#1C0F0A",
  gold:"#B8965A", goldL:"#D4B483", taupe:"#8C7B6E",
  cream:"#F5EFE6", muted:"#9B8880", brd:"#E8DDD5",
  ok:"#3E7A55", err:"#8B3A3A",
};

// ──────────────────────────────────────────────────────────────────
// 3. CAPA DE UI  (React Component Layer)
// ──────────────────────────────────────────────────────────────────

// ── Header ────────────────────────────────────────────────────────
function Header({ view, nav }) {
  const links = [["home","Inicio"],["book","Reservar"],["myapts","Mis Citas"],["admin","Admin"]];
  return (
    <header style={{background:T.dark,padding:"14px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:200,borderBottom:"1px solid rgba(184,150,90,.2)"}}>
      <div onClick={()=>nav("home")} style={{cursor:"pointer",userSelect:"none"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",fontWeight:300,color:T.goldL,letterSpacing:"0.18em"}}>LUMIÈRE</div>
        <div style={{fontSize:"8px",letterSpacing:"0.35em",color:T.taupe,textTransform:"uppercase",marginTop:"-2px"}}>SALON & SPA · PEREIRA</div>
      </div>
      <nav style={{display:"flex",gap:"6px"}}>
        {links.map(([v,label]) => (
          <button key={v} onClick={()=>nav(v)} style={{background:view===v?T.gold:"transparent",color:view===v?T.dark:T.goldL,border:`1px solid ${view===v?T.gold:"rgba(184,150,90,.3)"}`,borderRadius:"4px",padding:"7px 18px",fontSize:"11px",letterSpacing:"0.08em",fontFamily:"'DM Sans',sans-serif",cursor:"pointer",fontWeight:600,textTransform:"uppercase",transition:"all .2s"}}>
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}

// ── Página de Inicio ───────────────────────────────────────────────
function Home({ nav }) {
  return (
    <div>
      {/* Hero */}
      <section style={{background:T.dark,color:T.cream,minHeight:"88vh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center",position:"relative",overflow:"hidden",padding:"80px 40px"}}>
        <div style={{position:"absolute",inset:0,opacity:.04,backgroundImage:"radial-gradient(circle at 2px 2px,#B8965A 1px,transparent 0)",backgroundSize:"44px 44px"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:"10px",letterSpacing:"0.45em",color:T.gold,textTransform:"uppercase",marginBottom:"28px",fontWeight:400}}>Pereira · Colombia · Desde 2015</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(64px,12vw,110px)",fontWeight:300,letterSpacing:"0.1em",lineHeight:0.95,margin:"0 0 10px",color:T.cream}}>LUMIÈRE</h1>
          <div style={{width:"90px",height:"1px",background:`linear-gradient(90deg,transparent,${T.gold},transparent)`,margin:"20px auto"}}/>
          <p style={{fontSize:"clamp(11px,1.8vw,14px)",fontWeight:300,color:T.muted,letterSpacing:"0.25em",textTransform:"uppercase",marginBottom:"44px"}}>Salon & Spa · Belleza de Autor</p>
          <p style={{maxWidth:"460px",margin:"0 auto 48px",fontSize:"15px",lineHeight:1.8,color:"#B0A090",fontWeight:300}}>Descubre una experiencia de belleza única. Nuestros especialistas transforman tu visión en realidad con técnicas de vanguardia internacional.</p>
          <button onClick={()=>nav("book")} style={{background:T.gold,color:T.dark,border:"none",padding:"16px 52px",fontSize:"11px",letterSpacing:"0.25em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,borderRadius:"2px",boxShadow:`0 8px 32px rgba(184,150,90,.35)`}}>
            Reservar Cita
          </button>
        </div>
      </section>

      {/* Servicios */}
      <section style={{padding:"80px 40px",maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"52px"}}>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"44px",fontWeight:400,marginBottom:"10px",letterSpacing:"0.05em"}}>Nuestros Servicios</h2>
          <div style={{width:"56px",height:"1px",background:T.gold,margin:"0 auto 14px"}}/>
          <p style={{color:T.muted,fontSize:"14px",maxWidth:"440px",margin:"0 auto",lineHeight:1.7}}>Cada servicio es diseñado para realzar tu belleza natural con los mejores productos y técnicas.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:"18px"}}>
          {SERVICES.map((svc,i) => (
            <div key={svc.id} onClick={()=>nav("book")} style={{background:T.surf,border:`1px solid ${T.brd}`,borderRadius:"10px",padding:"26px 22px",cursor:"pointer",transition:"all .22s",animationDelay:`${i*.04}s`}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.gold;e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 10px 30px rgba(0,0,0,.07)`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.brd;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
              <div style={{fontSize:"26px",marginBottom:"12px"}}>{svc.emoji}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"19px",fontWeight:600,marginBottom:"6px"}}>{svc.name}</div>
              <div style={{fontSize:"12px",color:T.muted,marginBottom:"14px",lineHeight:1.55}}>{svc.desc}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:T.gold,fontWeight:700,fontSize:"14px"}}>{cop(svc.price)}</span>
                <span style={{fontSize:"10px",color:T.taupe,background:T.cream,padding:"3px 10px",borderRadius:"20px"}}>{svc.dur} min</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Equipo */}
      <section style={{background:T.dark,padding:"80px 40px",color:T.cream}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"52px"}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"44px",fontWeight:400,color:T.cream,marginBottom:"10px"}}>Nuestro Equipo</h2>
            <div style={{width:"56px",height:"1px",background:T.gold,margin:"0 auto"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"22px"}}>
            {STAFF.map(st => (
              <div key={st.id} style={{textAlign:"center",padding:"32px 20px",border:"1px solid rgba(184,150,90,.18)",borderRadius:"10px",background:"rgba(255,255,255,.03)"}}>
                <div style={{width:"68px",height:"68px",borderRadius:"50%",background:st.bg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:"20px",fontWeight:700,color:"#fff",letterSpacing:"0.04em"}}>{st.initials}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",marginBottom:"4px",color:T.cream}}>{st.name}</div>
                <div style={{fontSize:"11px",color:T.gold,marginBottom:"12px",letterSpacing:"0.06em",textTransform:"uppercase"}}>{st.role}</div>
                <div style={{fontSize:"12px",color:"#9B8880",lineHeight:1.6,marginBottom:"14px"}}>{st.bio}</div>
                <div style={{fontSize:"12px",color:T.goldL}}>⭐ {st.rating} <span style={{color:T.taupe}}>({st.reviews} reseñas)</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ¿Cómo funciona? */}
      <section style={{padding:"80px 40px",maxWidth:"880px",margin:"0 auto",textAlign:"center"}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"44px",fontWeight:400,marginBottom:"10px"}}>¿Cómo funciona?</h2>
        <div style={{width:"56px",height:"1px",background:T.gold,margin:"0 auto 52px"}}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"40px"}}>
          {[
            {n:"01",title:"Elige tu servicio",desc:"Selecciona el tratamiento que deseas y el especialista de tu preferencia."},
            {n:"02",title:"Fecha y hora",desc:"Consulta la disponibilidad en tiempo real y reserva tu horario ideal."},
            {n:"03",title:"Disfruta tu cita",desc:"Recibe confirmación inmediata y preséntate relajada. Nosotros hacemos el resto."},
          ].map(({n,title,desc}) => (
            <div key={n} style={{padding:"24px 16px"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"54px",fontWeight:300,color:T.goldL,lineHeight:1,marginBottom:"16px"}}>{n}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"21px",fontWeight:600,marginBottom:"12px"}}>{title}</div>
              <div style={{fontSize:"13px",color:T.taupe,lineHeight:1.8}}>{desc}</div>
            </div>
          ))}
        </div>
        <button onClick={()=>nav("book")} style={{marginTop:"48px",background:"transparent",color:T.dark,border:`2px solid ${T.gold}`,padding:"15px 52px",fontSize:"11px",letterSpacing:"0.22em",textTransform:"uppercase",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,borderRadius:"2px"}}>
          Agendar Ahora
        </button>
      </section>

      {/* Footer */}
      <footer style={{background:T.dark,padding:"32px 40px",textAlign:"center",borderTop:"1px solid rgba(184,150,90,.15)"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",color:T.goldL,letterSpacing:"0.22em",marginBottom:"8px"}}>LUMIÈRE</div>
        <div style={{fontSize:"11px",color:T.taupe,letterSpacing:"0.05em"}}>© 2026 Lumière Salon & Spa · Pereira, Colombia · Todos los derechos reservados</div>
      </footer>
    </div>
  );
}

// ── Paso 1: Selección de Servicio ─────────────────────────────────
function Step1({ bk, setBk }) {
  const [filter, setFilter] = useState("");
  const cats = [...new Set(SERVICES.map(s => s.cat))];
  const shown = filter ? SERVICES.filter(s => s.cat===filter) : SERVICES;
  return (
    <div>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"30px",fontWeight:400,marginBottom:"6px"}}>¿Qué servicio deseas?</h2>
      <p style={{color:T.muted,marginBottom:"24px",fontSize:"14px"}}>Elige el tratamiento para tu próxima visita.</p>
      <div style={{display:"flex",gap:"8px",marginBottom:"22px",flexWrap:"wrap"}}>
        <Pill active={!filter} onClick={()=>setFilter("")}>Todos</Pill>
        {cats.map(cat => <Pill key={cat} active={filter===cat} onClick={()=>setFilter(cat)}>{cat}</Pill>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
        {shown.map(svc => {
          const sel = bk.svc?.id===svc.id;
          return (
            <div key={svc.id} onClick={()=>setBk(b=>({...b,svc,staff:null,time:""}))}
              style={{border:`2px solid ${sel?T.gold:T.brd}`,borderRadius:"8px",padding:"20px",cursor:"pointer",background:sel?"#FFF9EF":T.surf,transition:"border-color .15s,background .15s"}}
              onMouseEnter={e=>{if(!sel)e.currentTarget.style.borderColor=T.goldL;}}
              onMouseLeave={e=>{if(!sel)e.currentTarget.style.borderColor=T.brd;}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                <span style={{fontSize:"24px"}}>{svc.emoji}</span>
                {sel && <span style={{color:T.gold,fontSize:"18px",fontWeight:700}}>✓</span>}
              </div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",fontWeight:600,marginBottom:"5px"}}>{svc.name}</div>
              <div style={{fontSize:"11px",color:T.muted,marginBottom:"12px",lineHeight:1.5}}>{svc.desc}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:T.gold,fontWeight:700,fontSize:"14px"}}>{cop(svc.price)}</span>
                <span style={{fontSize:"10px",color:T.taupe,background:T.cream,padding:"3px 10px",borderRadius:"20px"}}>{svc.dur} min</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Paso 2: Selección de Especialista ────────────────────────────
function Step2({ bk, setBk }) {
  const compat = bk.svc ? STAFF.filter(s => s.specialties.includes(bk.svc.id)) : STAFF;
  return (
    <div>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"30px",fontWeight:400,marginBottom:"6px"}}>Elige tu especialista</h2>
      <p style={{color:T.muted,marginBottom:"24px",fontSize:"14px"}}>Especialistas disponibles para <strong>{bk.svc?.name}</strong>.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
        {compat.map(st => {
          const sel = bk.staff?.id===st.id;
          return (
            <div key={st.id} onClick={()=>setBk(b=>({...b,staff:st,time:""}))}
              style={{border:`2px solid ${sel?T.gold:T.brd}`,borderRadius:"8px",padding:"22px",cursor:"pointer",background:sel?"#FFF9EF":T.surf,transition:"border-color .15s"}}
              onMouseEnter={e=>{if(!sel)e.currentTarget.style.borderColor=T.goldL;}}
              onMouseLeave={e=>{if(!sel)e.currentTarget.style.borderColor=T.brd;}}>
              <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"12px"}}>
                <div style={{width:"50px",height:"50px",borderRadius:"50%",background:st.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"15px",fontWeight:700,color:"#fff",flexShrink:0}}>{st.initials}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"18px",fontWeight:600}}>{st.name}</div>
                  <div style={{fontSize:"11px",color:T.gold,textTransform:"uppercase",letterSpacing:"0.04em"}}>{st.role}</div>
                </div>
                {sel && <span style={{color:T.gold,fontSize:"20px"}}>✓</span>}
              </div>
              <div style={{fontSize:"11px",color:T.muted,lineHeight:1.5,marginBottom:"10px"}}>{st.bio}</div>
              <div style={{fontSize:"11px",color:T.taupe}}>⭐ {st.rating} · {st.reviews} reseñas</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Paso 3: Fecha y Hora ──────────────────────────────────────────
function Step3({ bk, setBk }) {
  const slots = useMemo(() =>
    bk.staff && bk.date && bk.svc ? Availability.get(bk.staff.id, bk.date, bk.svc.dur) : [],
    [bk.staff, bk.date, bk.svc]
  );
  return (
    <div>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"30px",fontWeight:400,marginBottom:"6px"}}>Fecha y hora</h2>
      <p style={{color:T.muted,marginBottom:"24px",fontSize:"14px"}}>Disponibilidad de <strong>{bk.staff?.name}</strong> para <strong>{bk.svc?.name}</strong>.</p>
      <div style={{marginBottom:"28px"}}>
        <Label>Selecciona la fecha</Label>
        <input type="date" min={todayS()} value={bk.date}
          onChange={e=>setBk(b=>({...b,date:e.target.value,time:""}))}
          style={{width:"100%",padding:"12px 16px",border:`1px solid ${T.brd}`,borderRadius:"6px",fontSize:"15px",background:T.surf,fontFamily:"'DM Sans',sans-serif",color:T.dark,cursor:"pointer"}}
        />
      </div>
      {bk.date && (
        <div>
          <Label>Horarios disponibles {slots.length===0 && <span style={{color:T.err,fontWeight:400,textTransform:"none",fontSize:"12px",letterSpacing:0}}> — Sin disponibilidad en esta fecha</span>}</Label>
          {slots.length===0
            ? <div style={{padding:"18px",background:"#FFF5F5",border:`1px solid #FFCACA`,borderRadius:"6px",fontSize:"13px",color:T.err}}>No hay horarios disponibles. Por favor elige otra fecha.</div>
            : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(88px,1fr))",gap:"8px"}}>
                {slots.map(slot => (
                  <button key={slot} onClick={()=>setBk(b=>({...b,time:slot}))}
                    style={{padding:"10px",border:`2px solid ${bk.time===slot?T.gold:T.brd}`,borderRadius:"6px",background:bk.time===slot?T.gold:T.surf,color:T.dark,fontSize:"14px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:bk.time===slot?700:400,transition:"all .12s"}}>
                    {slot}
                  </button>
                ))}
              </div>
          }
        </div>
      )}
    </div>
  );
}

// ── Paso 4: Datos del Cliente ─────────────────────────────────────
function Step4({ bk, setBk }) {
  return (
    <div>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"30px",fontWeight:400,marginBottom:"6px"}}>Tus datos</h2>
      <p style={{color:T.muted,marginBottom:"24px",fontSize:"14px"}}>Ingresa tu información de contacto para confirmar la cita.</p>

      {/* Resumen */}
      <div style={{background:T.cream,border:`1px solid ${T.brd}`,borderRadius:"8px",padding:"20px",marginBottom:"28px"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"17px",marginBottom:"12px",fontWeight:600}}>Resumen de reserva</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 24px",fontSize:"13px"}}>
          {[["Servicio",bk.svc?.name],["Especialista",bk.staff?.name],["Fecha",fmtDate(bk.date)],["Hora",bk.time],["Duración",`${bk.svc?.dur} min`],["Precio",cop(bk.svc?.price||0)]].map(([k,v])=>(
            <><span key={k+"k"} style={{color:T.muted}}>{k}</span><span key={k+"v"} style={{fontWeight:600,color:k==="Precio"?T.gold:T.dark}}>{v}</span></>
          ))}
        </div>
      </div>

      {[
        {label:"Nombre completo",   field:"name",  type:"text",  ph:"Ej: María García"},
        {label:"Correo electrónico",field:"email", type:"email", ph:"Ej: maria@email.com"},
        {label:"Teléfono / WhatsApp",field:"phone",type:"tel",   ph:"Ej: 3001234567"},
      ].map(({label,field,type,ph}) => (
        <div key={field} style={{marginBottom:"18px"}}>
          <Label>{label}</Label>
          <input type={type} placeholder={ph} value={bk[field]}
            onChange={e=>setBk(b=>({...b,[field]:e.target.value}))}
            style={{width:"100%",padding:"12px 16px",border:`1px solid ${T.brd}`,borderRadius:"6px",fontSize:"15px",background:T.surf,fontFamily:"'DM Sans',sans-serif",color:T.dark}}
          />
        </div>
      ))}
    </div>
  );
}

// ── Paso 5: Confirmación ──────────────────────────────────────────
function Step5({ confirmed, nav }) {
  const svc = gSvc(confirmed?.serviceId);
  const stf = gStf(confirmed?.staffId);
  return (
    <div style={{textAlign:"center",padding:"16px 0"}}>
      <div style={{fontSize:"52px",marginBottom:"18px"}}>🎉</div>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"34px",fontWeight:400,marginBottom:"8px",color:T.ok}}>¡Cita Confirmada!</h2>
      <p style={{color:T.muted,marginBottom:"32px",fontSize:"14px"}}>Tu reserva fue registrada exitosamente. ¡Te esperamos!</p>
      <div style={{background:T.surf,border:`2px solid ${T.gold}`,borderRadius:"12px",padding:"28px",maxWidth:"430px",margin:"0 auto 28px",textAlign:"left"}}>
        <div style={{borderBottom:`1px solid ${T.brd}`,paddingBottom:"14px",marginBottom:"16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"19px",fontWeight:600}}>Reserva #{confirmed?.id}</div>
          <span style={{background:"#E6F4EC",color:T.ok,padding:"4px 12px",borderRadius:"20px",fontSize:"10px",fontWeight:700,letterSpacing:"0.06em"}}>CONFIRMADA</span>
        </div>
        <div style={{display:"grid",gap:"10px",fontSize:"13px"}}>
          {[["Servicio",svc?.name],["Especialista",stf?.name],["Fecha",fmtDate(confirmed?.date)],["Hora",confirmed?.time],["Duración",`${svc?.dur} min`],["Total",cop(svc?.price||0)]].map(([k,v]) => (
            <div key={k} style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{color:T.muted}}>{k}</span>
              <span style={{fontWeight:600,color:k==="Total"?T.gold:T.dark}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap"}}>
        <button onClick={()=>nav("home")} style={{background:T.dark,color:T.cream,border:"none",padding:"12px 32px",borderRadius:"4px",cursor:"pointer",fontSize:"12px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,letterSpacing:"0.06em"}}>Inicio</button>
        <button onClick={()=>nav("book")} style={{background:"transparent",color:T.dark,border:`1px solid ${T.brd}`,padding:"12px 32px",borderRadius:"4px",cursor:"pointer",fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>Nueva Reserva</button>
        <button onClick={()=>nav("myapts")} style={{background:"transparent",color:T.gold,border:`1px solid ${T.gold}`,padding:"12px 32px",borderRadius:"4px",cursor:"pointer",fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>Ver Mis Citas</button>
      </div>
    </div>
  );
}

// ── Flujo de Reserva (orquesta los pasos) ─────────────────────────
function Booking({ step, setStep, bk, setBk, doConfirm, confirmed, nav }) {
  const STEPS = ["Servicio","Especialista","Fecha & Hora","Tus Datos","Confirmación"];

  const canNext = useMemo(() => {
    if (step===1) return !!bk.svc;
    if (step===2) return !!bk.staff;
    if (step===3) return !!(bk.date && bk.time);
    if (step===4) return !!(bk.name.trim() && bk.email.trim() && bk.phone.trim());
    return true;
  }, [step, bk]);

  return (
    <div style={{maxWidth:"780px",margin:"0 auto",padding:"48px 24px"}}>
      {/* Barra de progreso */}
      <div style={{marginBottom:"44px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"14px"}}>
          {STEPS.map((s,i) => (
            <div key={i} style={{textAlign:"center",flex:1}}>
              <div style={{width:"30px",height:"30px",borderRadius:"50%",background:i+1<=step?T.gold:T.brd,color:i+1<=step?T.dark:"#bbb",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 6px",fontSize:"12px",fontWeight:700,transition:"all .3s"}}>{i+1}</div>
              <div style={{fontSize:"9px",color:i+1===step?T.gold:T.muted,letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:i+1===step?700:400}}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{height:"2px",background:T.brd,borderRadius:"1px",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,height:"100%",background:T.gold,borderRadius:"1px",width:`${((step-1)/4)*100}%`,transition:"width .4s ease"}}/>
        </div>
      </div>

      {/* Contenido del paso actual */}
      <div key={step}>
        {step===1 && <Step1 bk={bk} setBk={setBk} />}
        {step===2 && <Step2 bk={bk} setBk={setBk} />}
        {step===3 && <Step3 bk={bk} setBk={setBk} />}
        {step===4 && <Step4 bk={bk} setBk={setBk} />}
        {step===5 && <Step5 confirmed={confirmed} nav={nav} />}
      </div>

      {/* Botones de navegación */}
      {step < 5 && (
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"36px",paddingTop:"22px",borderTop:`1px solid ${T.brd}`}}>
          <button onClick={()=>setStep(s=>s-1)} disabled={step===1}
            style={{background:"transparent",color:step===1?T.muted:T.dark,border:`1px solid ${step===1?T.brd:T.taupe}`,padding:"11px 28px",cursor:step===1?"not-allowed":"pointer",borderRadius:"4px",fontSize:"12px",letterSpacing:"0.06em",fontFamily:"'DM Sans',sans-serif",opacity:step===1?.5:1}}>
            ← Anterior
          </button>
          {step===4
            ? <button onClick={doConfirm} disabled={!canNext}
                style={{background:canNext?T.gold:"#ddd",color:canNext?T.dark:"#aaa",border:"none",padding:"11px 36px",cursor:canNext?"pointer":"not-allowed",borderRadius:"4px",fontSize:"12px",letterSpacing:"0.1em",fontFamily:"'DM Sans',sans-serif",fontWeight:700,textTransform:"uppercase"}}>
                Confirmar Cita ✓
              </button>
            : <button onClick={()=>setStep(s=>s+1)} disabled={!canNext}
                style={{background:canNext?T.gold:"#ddd",color:canNext?T.dark:"#aaa",border:"none",padding:"11px 28px",cursor:canNext?"pointer":"not-allowed",borderRadius:"4px",fontSize:"12px",letterSpacing:"0.08em",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>
                Siguiente →
              </button>
          }
        </div>
      )}
    </div>
  );
}

// ── Mis Citas (portal del cliente) ────────────────────────────────
function MyApts({ tick, setTick }) {
  const [email, setEmail] = useState("");
  const [apts,  setApts]  = useState(null);

  const search = async () => {
  const res = await fetch(`http://localhost:3000/appointments?email=${email.trim()}`);
  const data = await res.json();
  setApts(data.filter(a => a.clientEmail.toLowerCase() === email.trim().toLowerCase()));
};

const cancel = async (id) => {
  if (window.confirm("¿Cancelar esta cita?")) {
    await fetch(`http://localhost:3000/appointments/${id}`, { method: "PATCH" });
    search();
    setTick(t => t + 1);
  }
};

  return (
    <div style={{maxWidth:"680px",margin:"0 auto",padding:"48px 24px"}}>
      <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"34px",fontWeight:400,marginBottom:"6px"}}>Mis Citas</h1>
      <p style={{color:T.muted,marginBottom:"24px",fontSize:"14px"}}>Consulta y gestiona tus reservas activas.</p>

      <div style={{background:"#FFF9EF",border:`1px solid ${T.goldL}`,borderRadius:"6px",padding:"11px 16px",marginBottom:"22px",fontSize:"12px",color:T.taupe}}>
        💡 <strong>Demo:</strong> Usa <code>demo@email.com</code> para ver citas de ejemplo
      </div>

      <div style={{display:"flex",gap:"10px",marginBottom:"32px"}}>
        <input type="email" placeholder="tu@correo.com" value={email}
          onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()}
          style={{flex:1,padding:"12px 16px",border:`1px solid ${T.brd}`,borderRadius:"6px",fontSize:"14px",fontFamily:"'DM Sans',sans-serif",color:T.dark}}
        />
        <button onClick={search} style={{background:T.dark,color:T.cream,border:"none",padding:"12px 24px",borderRadius:"6px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"13px"}}>Consultar</button>
      </div>

      {apts !== null && (
        <div>
          {apts.length===0
            ? <div style={{textAlign:"center",padding:"40px",color:T.muted,fontSize:"14px"}}>No se encontraron citas para este correo.</div>
            : <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                {apts.map(a => {
                  const svc=gSvc(a.serviceId), stf=gStf(a.staffId), can=a.status==="cancelled";
                  return (
                    <div key={a.id} style={{background:T.surf,border:`1px solid ${T.brd}`,borderRadius:"10px",padding:"22px",opacity:can?.6:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
                        <div>
                          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"19px",fontWeight:600}}>{svc?.emoji} {svc?.name}</div>
                          <div style={{fontSize:"12px",color:T.muted,marginTop:"3px"}}>con {stf?.name} · {stf?.role}</div>
                        </div>
                        <span style={{background:can?"#FFE8E8":"#E6F4EC",color:can?T.err:T.ok,padding:"4px 12px",borderRadius:"20px",fontSize:"10px",fontWeight:700,letterSpacing:"0.06em",flexShrink:0}}>
                          {can?"CANCELADA":"CONFIRMADA"}
                        </span>
                      </div>
                      <div style={{display:"flex",gap:"20px",fontSize:"12px",color:T.taupe,marginBottom:can?"0":"14px",flexWrap:"wrap"}}>
                        <span>📅 {fmtDate(a.date)}</span>
                        <span>🕐 {a.time}</span>
                        <span>⏱ {svc?.dur} min</span>
                        <span style={{color:T.gold,fontWeight:700}}>{cop(svc?.price||0)}</span>
                      </div>
                      {!can && (
                        <button onClick={()=>cancel(a.id)}
                          style={{background:"transparent",color:T.err,border:`1px solid ${T.err}`,padding:"7px 18px",borderRadius:"4px",cursor:"pointer",fontSize:"11px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
                          Cancelar cita
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
          }
        </div>
      )}
    </div>
  );
}

// ── Panel de Administración ───────────────────────────────────────
function Admin({ tick, setTick }) {
  const [fDate,   setFDate]   = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fStaff,  setFStaff]  = useState("");

 const [all, setAll] = useState([]);

useEffect(() => {
  fetch("http://localhost:3000/appointments")
    .then(r => r.json())
    .then(setAll);
}, [tick]);

  const rows = useMemo(() =>
    all.filter(a => {
      if (fDate   && a.date!==fDate)       return false;
      if (fStatus && a.status!==fStatus)   return false;
      if (fStaff  && a.staffId!==fStaff)   return false;
      return true;
    }).sort((a,b) => a.date.localeCompare(b.date)||a.time.localeCompare(b.time)),
    [all, fDate, fStatus, fStaff]
  );

  const cancelRow = async (id) => {
  if (window.confirm("¿Cancelar esta cita?")) {
    await fetch(`http://localhost:3000/appointments/${id}`, { method: "PATCH" });
    setTick(t => t + 1);
  }
};

  const selStyle = {width:"100%",padding:"10px 12px",border:`1px solid ${T.brd}`,borderRadius:"6px",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",color:T.dark,background:T.surf};

  return (
    <div style={{maxWidth:"1100px",margin:"0 auto",padding:"48px 24px"}}>
      <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"34px",fontWeight:400,marginBottom:"6px"}}>Panel de Administración</h1>
      <p style={{color:T.muted,marginBottom:"36px",fontSize:"14px"}}>Gestión de citas · LUMIÈRE Salon & Spa</p>

      {/* Tarjetas de estadísticas */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"18px",marginBottom:"36px"}}>
        {[
          {label:"Total Citas",    value:stats.total,        col:T.dark},
          {label:"Confirmadas",    value:stats.confirmed,    col:T.ok},
          {label:"Hoy",            value:stats.today,        col:T.gold},
          {label:"Ingresos Est.",  value:cop(stats.revenue), col:"#4A6E8C"},
        ].map(({label,value,col}) => (
          <div key={label} style={{background:T.surf,border:`1px solid ${T.brd}`,borderRadius:"10px",padding:"22px"}}>
            <div style={{fontSize:"10px",color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"8px"}}>{label}</div>
            <div style={{fontSize:"28px",fontWeight:700,color:col,fontFamily:"'Cormorant Garamond',serif"}}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{display:"flex",gap:"14px",marginBottom:"22px",flexWrap:"wrap",alignItems:"flex-end"}}>
        <div style={{flex:1,minWidth:"160px"}}>
          <Label>Fecha</Label>
          <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)} style={selStyle}/>
        </div>
        <div style={{flex:1,minWidth:"140px"}}>
          <Label>Estado</Label>
          <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={selStyle}>
            <option value="">Todos</option>
            <option value="confirmed">Confirmadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
        <div style={{flex:1,minWidth:"160px"}}>
          <Label>Especialista</Label>
          <select value={fStaff} onChange={e=>setFStaff(e.target.value)} style={selStyle}>
            <option value="">Todos</option>
            {STAFF.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button onClick={()=>{setFDate("");setFStatus("");setFStaff("");}}
          style={{padding:"10px 18px",background:T.cream,border:`1px solid ${T.brd}`,borderRadius:"6px",cursor:"pointer",fontSize:"12px",fontFamily:"'DM Sans',sans-serif",color:T.taupe,whiteSpace:"nowrap"}}>
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      <div style={{background:T.surf,border:`1px solid ${T.brd}`,borderRadius:"10px",overflow:"hidden"}}>
        <div style={{padding:"14px 22px",borderBottom:`1px solid ${T.brd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:600,fontSize:"14px"}}>{rows.length} cita{rows.length!==1?"s":""} encontrada{rows.length!==1?"s":""}</span>
        </div>
        {rows.length===0
          ? <div style={{padding:"40px",textAlign:"center",color:T.muted,fontSize:"13px"}}>No hay citas con los filtros seleccionados.</div>
          : <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                <thead>
                  <tr style={{background:T.cream}}>
                    {["ID","Fecha","Hora","Servicio","Especialista","Cliente","Teléfono","Estado",""].map(h=>(
                      <th key={h} style={{padding:"11px 14px",textAlign:"left",fontWeight:600,color:T.taupe,fontSize:"10px",letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a,i) => {
                    const svc=gSvc(a.serviceId), stf=gStf(a.staffId), can=a.status==="cancelled";
                    return (
                      <tr key={a.id} style={{borderTop:`1px solid ${T.brd}`,background:i%2===0?"transparent":"#FAFAF8",opacity:can?.6:1}}>
                        <td style={{padding:"11px 14px",color:T.muted,fontFamily:"monospace",fontSize:"10px"}}>{a.id}</td>
                        <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}>{fmtDate(a.date)}</td>
                        <td style={{padding:"11px 14px"}}>{a.time}</td>
                        <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}>{svc?.emoji} {svc?.name}</td>
                        <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}>{stf?.name}</td>
                        <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}>{a.clientName}</td>
                        <td style={{padding:"11px 14px",color:T.muted}}>{a.clientPhone}</td>
                        <td style={{padding:"11px 14px"}}>
                          <span style={{background:can?"#FFE8E8":"#E6F4EC",color:can?T.err:T.ok,padding:"3px 10px",borderRadius:"20px",fontSize:"9px",fontWeight:700,letterSpacing:"0.06em"}}>
                            {can?"CANCELADA":"CONFIRMADA"}
                          </span>
                        </td>
                        <td style={{padding:"11px 14px"}}>
                          {!can && (
                            <button onClick={()=>cancelRow(a.id)}
                              style={{background:"transparent",color:T.err,border:`1px solid ${T.err}`,padding:"5px 12px",borderRadius:"4px",cursor:"pointer",fontSize:"10px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,whiteSpace:"nowrap"}}>
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  );
}

// ── Micro-componentes compartidos ─────────────────────────────────
function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{background:active?T.dark:T.cream,color:active?T.cream:T.taupe,border:"none",padding:"7px 16px",borderRadius:"20px",fontSize:"11px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,letterSpacing:"0.04em",transition:"all .15s"}}>
      {children}
    </button>
  );
}
function Label({ children }) {
  return <div style={{fontSize:"10px",letterSpacing:"0.1em",textTransform:"uppercase",color:T.taupe,marginBottom:"8px",fontWeight:600}}>{children}</div>;
}

// ── App Principal ─────────────────────────────────────────────────
export default function App() {
  // Cargar fuentes tipográficas
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap";
    document.head.appendChild(l);
  }, []);

  // Estado global de navegación y flujo de reserva
  const [view,      setView]  = useState("home");
  const [step,      setStep]  = useState(1);
  const [bk,        setBk]    = useState({svc:null,staff:null,date:"",time:"",name:"",email:"",phone:""});
  const [confirmed, setCon]   = useState(null);
  const [tick,      setTick]  = useState(0); // refresca vistas al cancelar

  // Navegar entre vistas limpiando el estado de reserva
  const nav = v => {
    setView(v); setStep(1);
    setBk({svc:null,staff:null,date:"",time:"",name:"",email:"",phone:""});
    setCon(null); window.scrollTo(0,0);
  };

  // Confirmar y persistir la cita
const doConfirm = async () => {
  try {
    const res = await fetch("http://localhost:3000/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        serviceId: bk.svc.id,
        staffId: bk.staff.id,
        date: bk.date,
        time: bk.time,
        clientName: bk.name,
        clientEmail: bk.email,
        clientPhone: bk.phone
      })
    });

    const data = await res.json();

    setCon(data);
    setStep(5);
    setTick(t => t + 1);

  } catch (error) {
    console.error("Error al guardar cita:", error);
  }
};