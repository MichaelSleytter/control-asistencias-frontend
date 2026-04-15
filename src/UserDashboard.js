import { useEffect, useState } from "react";
import {
  getMisAsistencias, getMiTotal, getAlmacentesPublic,
  registrarAsistencia, registrarPagoExtra,
  getNotificaciones, confirmarNotif,
} from "./api";

export default function UserDashboard() {
  const token = localStorage.getItem("token");

  const [asistencias, setAsistencias]   = useState([]);
  const [total, setTotal]               = useState(0);
  const [almacenes, setAlmacenes]       = useState([]);
  const [almacenId, setAlmacenId]       = useState("");
  const [motivo, setMotivo]             = useState("");
  const [monto, setMonto]               = useState("");
  const [loadingAsist, setLoadingAsist] = useState(false);
  const [loadingPago, setLoadingPago]   = useState(false);
  const [msgAsist, setMsgAsist]         = useState(null);
  const [msgPago, setMsgPago]           = useState(null);

  // Notificaciones pendientes
  const [notificaciones, setNotificaciones] = useState([]);
  const [confirmando, setConfirmando]       = useState(null);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    window.location.href = "/";
  };

  const cargarDatos = async () => {
    try {
      const [asist, tot, notifs] = await Promise.all([
        getMisAsistencias(token),
        getMiTotal(token),
        getNotificaciones(token),
      ]);
      setAsistencias(asist || []);
      setTotal(tot || 0);
      setNotificaciones(notifs || []);
    } catch (err) { console.error(err); }
  };

  const cargarAlmacenes = async () => {
    try {
      const data = await getAlmacentesPublic(token);
      setAlmacenes(data || []);
    } catch (err) { console.error(err); }
  };

  const handleRegistrarAsistencia = async () => {
    if (!almacenId) { setMsgAsist({ tipo: "error", texto: "Selecciona un almacén" }); return; }
    setLoadingAsist(true); setMsgAsist(null);
    try {
      await registrarAsistencia(token, almacenId);
      setMsgAsist({ tipo: "ok", texto: "Asistencia registrada correctamente" });
      setAlmacenId("");
      cargarDatos();
    } catch (err) { setMsgAsist({ tipo: "error", texto: err.message }); }
    finally { setLoadingAsist(false); }
  };

  const handleRegistrarPagoExtra = async () => {
    if (!motivo.trim() || !monto) { setMsgPago({ tipo: "error", texto: "Completa motivo y monto" }); return; }
    setLoadingPago(true); setMsgPago(null);
    try {
      await registrarPagoExtra(token, motivo, parseFloat(monto));
      setMsgPago({ tipo: "ok", texto: "Pago extra registrado correctamente" });
      setMotivo(""); setMonto("");
      cargarDatos();
    } catch (err) { setMsgPago({ tipo: "error", texto: err.message }); }
    finally { setLoadingPago(false); }
  };

  const handleConfirmar = async (id) => {
    setConfirmando(id);
    try {
      await confirmarNotif(token, id);
      await cargarDatos();
    } catch (err) { alert(err.message); }
    finally { setConfirmando(null); }
  };

  useEffect(() => {
    if (!token) { window.location.href = "/"; return; }
    cargarDatos();
    cargarAlmacenes();
  }, []);

  // ─── NOTIFICACIONES PENDIENTES — bloquean el panel ───
  if (notificaciones.length > 0) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.headerLeft}>
            <span style={s.headerIcon}>👷</span>
            <div>
              <h1 style={s.headerTitle}>Panel de Trabajador</h1>
              <p style={s.headerSub}>Tienes notificaciones pendientes</p>
            </div>
          </div>
          <button onClick={cerrarSesion} style={s.btnCerrar}>Cerrar sesión</button>
        </div>

        <div style={s.card}>
          <div style={s.notifHeader}>
            <span style={{ fontSize: 28 }}>🔔</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
                Tienes {notificaciones.length} notificación{notificaciones.length > 1 ? "es" : ""} pendiente{notificaciones.length > 1 ? "s" : ""}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "#888" }}>
                Debes confirmarlas para continuar usando el panel
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
            {notificaciones.map(n => (
              <div key={n.id} style={notifCard(n.tipo)}>
                <div style={s.notifIconWrap}>
                  <span style={{ fontSize: 24 }}>{n.tipo === "PAGO_COMPLETO" ? "✅" : "💵"}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={s.notifTipo}>
                    {n.tipo === "PAGO_COMPLETO" ? "Pago de sueldo registrado" : "Adelanto de sueldo"}
                  </p>
                  <p style={s.notifMensaje}>{n.mensaje}</p>
                  <p style={s.notifFecha}>
                    {new Date(n.fechaCreacion).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button
                  onClick={() => handleConfirmar(n.id)}
                  disabled={confirmando === n.id}
                  style={s.btnConfirmar}
                >
                  {confirmando === n.id ? "..." : "Confirmar ✓"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── PANEL NORMAL ────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.headerIcon}>👷</span>
          <div>
            <h1 style={s.headerTitle}>Panel de Trabajador</h1>
            <p style={s.headerSub}>Registro de asistencias y pagos</p>
          </div>
        </div>
        <button onClick={cerrarSesion} style={s.btnCerrar}>Cerrar sesión</button>
      </div>

      <div style={s.totalCard}>
        <p style={s.totalLabel}>Total pendiente de cobro</p>
        <p style={s.totalMonto}>S/. {Number(total).toFixed(2)}</p>
        <p style={s.totalSub}>
          {asistencias.filter(a => a.estado !== "PAGADO").length} día{asistencias.filter(a => a.estado !== "PAGADO").length !== 1 ? "s" : ""} pendiente{asistencias.filter(a => a.estado !== "PAGADO").length !== 1 ? "s" : ""}
        </p>
      </div>

      <div style={s.grid}>
        <div style={s.card}>
          <h2 style={s.cardTitle}>📋 Registrar Asistencia</h2>
          <label style={s.label}>Almacén</label>
          <select style={s.select} value={almacenId} onChange={e => setAlmacenId(e.target.value)}>
            <option value="">— Selecciona un almacén —</option>
            {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          {msgAsist && <div style={msgAsist.tipo === "ok" ? s.msgOk : s.msgError}>{msgAsist.texto}</div>}
          <button onClick={handleRegistrarAsistencia} disabled={loadingAsist} style={{ ...s.btnPrimary, opacity: loadingAsist ? 0.7 : 1 }}>
            {loadingAsist ? "Registrando..." : "Registrar asistencia"}
          </button>
        </div>

        <div style={s.card}>
          <h2 style={s.cardTitle}>💰 Pago Extra</h2>
          <label style={s.label}>Motivo</label>
          <input style={s.input} placeholder="Ej: Hora extra, bono, etc." value={motivo} onChange={e => setMotivo(e.target.value)} />
          <label style={s.label}>Monto (S/.)</label>
          <input style={s.input} type="number" min="0" placeholder="0.00" value={monto} onChange={e => setMonto(e.target.value)} />
          {msgPago && <div style={msgPago.tipo === "ok" ? s.msgOk : s.msgError}>{msgPago.texto}</div>}
          <button onClick={handleRegistrarPagoExtra} disabled={loadingPago} style={{ ...s.btnSuccess, opacity: loadingPago ? 0.7 : 1 }}>
            {loadingPago ? "Registrando..." : "Registrar pago extra"}
          </button>
        </div>
      </div>

      <div style={s.card}>
        <h2 style={s.cardTitle}>📅 Historial de Asistencias</h2>
        {asistencias.length === 0 ? (
          <p style={s.empty}>No hay asistencias registradas aún.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Fecha</th>
                <th style={s.th}>Almacén</th>
                <th style={s.th}>Pago del día</th>
                <th style={s.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map((a, i) => (
                <tr key={i} style={i % 2 === 0 ? s.trEven : {}}>
                  <td style={s.td}>{a.fecha}</td>
                  <td style={s.td}>{a.almacen?.nombre || "—"}</td>
                  <td style={{ ...s.td, color: a.estado === "PAGADO" ? "#6b7280" : "#374151", textDecoration: a.estado === "PAGADO" ? "line-through" : "none" }}>
                    S/. {Number(a.pagoDia).toFixed(2)}
                  </td>
                  <td style={s.td}><span style={estadoBadge(a.estado)}>{a.estado || "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const notifCard = (tipo) => ({
  display: "flex", alignItems: "flex-start", gap: 14,
  padding: "16px", borderRadius: 12,
  background: tipo === "PAGO_COMPLETO" ? "#f0fdf4" : "#fffbeb",
  border: `1px solid ${tipo === "PAGO_COMPLETO" ? "#bbf7d0" : "#fde68a"}`,
});

const estadoBadge = (estado) => {
  const base = { fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99 };
  const c = { REGISTRADO: { background: "#e0f2fe", color: "#0369a1" }, VALIDADO: { background: "#dcfce7", color: "#15803d" }, PAGADO: { background: "#f1f5f9", color: "#6b7280" } };
  return { ...base, ...(c[estado] || { background: "#f1f5f9", color: "#475569" }) };
};

const s = {
  page:        { minHeight:"100vh", background:"#f0f2f5", padding:"20px 16px", fontFamily:"Arial, sans-serif", maxWidth:900, margin:"0 auto" },
  header:      { background:"#fff", borderRadius:14, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" },
  headerLeft:  { display:"flex", alignItems:"center", gap:12 },
  headerIcon:  { fontSize:28 },
  headerTitle: { margin:0, fontSize:18, fontWeight:700, color:"#1a1a2e" },
  headerSub:   { margin:0, fontSize:13, color:"#888" },
  btnCerrar:   { background:"#ef4444", color:"#fff", border:"none", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:13 },
  totalCard:   { background:"linear-gradient(135deg,#1d4ed8,#2563eb)", borderRadius:14, padding:"24px 28px", marginBottom:16, color:"#fff", textAlign:"center", boxShadow:"0 4px 16px rgba(37,99,235,0.3)" },
  totalLabel:  { margin:0, fontSize:13, opacity:0.85 },
  totalMonto:  { margin:"6px 0 4px", fontSize:36, fontWeight:700 },
  totalSub:    { margin:0, fontSize:13, opacity:0.75 },
  grid:        { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:16, marginBottom:16 },
  card:        { background:"#fff", borderRadius:14, padding:"20px 22px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", marginBottom:16 },
  cardTitle:   { margin:"0 0 16px", fontSize:16, fontWeight:700, color:"#1a1a2e" },
  label:       { display:"block", fontSize:12, fontWeight:600, color:"#555", marginBottom:6 },
  input:       { width:"100%", padding:"9px 12px", border:"1px solid #ddd", borderRadius:8, fontSize:14, marginBottom:12, boxSizing:"border-box" },
  select:      { width:"100%", padding:"9px 12px", border:"1px solid #ddd", borderRadius:8, fontSize:14, marginBottom:12, boxSizing:"border-box", background:"#fff" },
  btnPrimary:  { width:"100%", padding:"10px", background:"#2563eb", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", marginTop:4 },
  btnSuccess:  { width:"100%", padding:"10px", background:"#16a34a", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", marginTop:4 },
  btnConfirmar:{ background:"#1d4ed8", color:"#fff", border:"none", padding:"10px 18px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:14, whiteSpace:"nowrap" },
  notifHeader: { display:"flex", alignItems:"center", gap:12 },
  notifIconWrap:{ width:44, height:44, borderRadius:"50%", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  notifTipo:   { margin:"0 0 4px", fontSize:15, fontWeight:700, color:"#1a1a2e" },
  notifMensaje:{ margin:"0 0 6px", fontSize:14, color:"#374151" },
  notifFecha:  { margin:0, fontSize:12, color:"#9ca3af" },
  msgOk:       { background:"#f0fdf4", color:"#166534", border:"1px solid #bbf7d0", borderRadius:8, padding:"8px 12px", fontSize:13, marginBottom:10 },
  msgError:    { background:"#fff0f0", color:"#c0392b", border:"1px solid #f5c6cb", borderRadius:8, padding:"8px 12px", fontSize:13, marginBottom:10 },
  table:       { width:"100%", borderCollapse:"collapse", fontSize:14 },
  th:          { textAlign:"left", padding:"10px 12px", borderBottom:"2px solid #e5e7eb", fontSize:12, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.04em" },
  td:          { padding:"10px 12px", borderBottom:"1px solid #f1f5f9", color:"#374151" },
  trEven:      { background:"#f9fafb" },
  empty:       { color:"#9ca3af", fontSize:14, textAlign:"center", padding:"20px 0" },
};