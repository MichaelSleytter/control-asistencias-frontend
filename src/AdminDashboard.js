import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  getUsuarios, getUsuariosInactivos, crearUsuario, eliminarUsuario, reactivarUsuario,
  getAlmacenes, getAlmacenesInactivos, crearAlmacen, eliminarAlmacen, reactivarAlmacen,
  getReporte, getMisAsistenciasDeUsuario,
  marcarPagoCompleto, registrarAdelanto,
} from "./api";

const VISTA = { PANEL:"PANEL", TRABAJADORES:"TRABAJADORES", HISTORIAL:"HISTORIAL", INACTIVOS:"INACTIVOS" };

// ─── Modal de adelanto ────────────────────────────────────────────────────────
function ModalAdelanto({ usuario, onClose, onConfirm }) {
  const [monto, setMonto] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!monto || parseFloat(monto) <= 0) { alert("Ingresa un monto válido"); return; }
    setLoading(true);
    try { await onConfirm(parseFloat(monto)); onClose(); }
    catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };
  return (
    <div style={ms.overlay}>
      <div style={ms.modal}>
        <h2 style={ms.title}>💵 Registrar adelanto</h2>
        <p style={ms.sub}>Trabajador: <strong>{usuario.usuario}</strong></p>
        <label style={ms.label}>Monto a adelantar (S/.)</label>
        <input style={ms.input} type="number" min="0" placeholder="0.00" value={monto} onChange={e => setMonto(e.target.value)} autoFocus />
        <div style={ms.btns}>
          <button onClick={onClose} style={ms.btnCancel}>Cancelar</button>
          <button onClick={submit} disabled={loading} style={ms.btnOk}>{loading ? "..." : "Enviar adelanto"}</button>
        </div>
      </div>
    </div>
  );
}

const ms = {
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 },
  modal:   { background:"#fff", borderRadius:16, padding:"28px 28px 24px", width:"100%", maxWidth:380, boxShadow:"0 8px 32px rgba(0,0,0,0.15)" },
  title:   { margin:"0 0 6px", fontSize:18, fontWeight:700, color:"#1a1a2e" },
  sub:     { margin:"0 0 18px", fontSize:14, color:"#555" },
  label:   { display:"block", fontSize:12, fontWeight:600, color:"#555", marginBottom:6 },
  input:   { width:"100%", padding:"10px 12px", border:"1px solid #ddd", borderRadius:8, fontSize:15, marginBottom:20, boxSizing:"border-box" },
  btns:    { display:"flex", gap:10 },
  btnCancel:{ flex:1, padding:"10px", background:"#f1f5f9", color:"#374151", border:"1px solid #e5e7eb", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:14 },
  btnOk:   { flex:1, padding:"10px", background:"#1d4ed8", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:14 },
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const token = localStorage.getItem("token");
  const [vista, setVista]  = useState(VISTA.PANEL);
  const [trab, setTrab]    = useState(null); // trabajador seleccionado

  const [usuarios,    setUsuarios]    = useState([]);
  const [inacUsuarios,setInacUsu]     = useState([]);
  const [almacenes,   setAlmacenes]   = useState([]);
  const [inacAlmacenes,setInacAlm]    = useState([]);
  const [reporte,     setReporte]     = useState([]);
  const [historial,   setHistorial]   = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);

  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [password,     setPassword]     = useState("");
  const [rol,          setRol]          = useState("USER");
  const [msgUsu,       setMsgUsu]       = useState(null);

  const [nombreAlm, setNombreAlm] = useState("");
  const [pagoBase,  setPagoBase]  = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [msgAlm,    setMsgAlm]    = useState(null);

  const [modalAdelanto, setModalAdelanto] = useState(null);
  const [msgPago,       setMsgPago]       = useState({});

  const cerrarSesion = () => { localStorage.removeItem("token"); localStorage.removeItem("rol"); window.location.href = "/"; };

  const cargarDatos = async () => {
    try {
      const [u, ui, a, ai, r] = await Promise.all([
        getUsuarios(token), getUsuariosInactivos(token),
        getAlmacenes(token), getAlmacenesInactivos(token),
        getReporte(token),
      ]);
      setUsuarios(u || []); setInacUsu(ui || []);
      setAlmacenes(a || []); setInacAlm(ai || []);
      setReporte(r || []);
    } catch (e) { console.error(e); }
  };

  const handleCrearUsuario = async () => {
    if (!nuevoUsuario.trim() || !password.trim()) { setMsgUsu({ tipo:"error", texto:"Completa usuario y contraseña" }); return; }
    try {
      await crearUsuario(token, { usuario: nuevoUsuario, password, rol });
      setNuevoUsuario(""); setPassword(""); setRol("USER");
      setMsgUsu({ tipo:"ok", texto:"Usuario creado" });
      cargarDatos();
    } catch (e) { setMsgUsu({ tipo:"error", texto: e.message }); }
  };

  const handleEliminarUsuario = async (id) => {
    if (!window.confirm("¿Desactivar usuario? Su historial se conservará.")) return;
    try { await eliminarUsuario(token, id); cargarDatos(); } catch (e) { alert(e.message); }
  };

  const handleReactivarUsuario = async (id) => {
    try { await reactivarUsuario(token, id); cargarDatos(); } catch (e) { alert(e.message); }
  };

  const handleCrearAlmacen = async () => {
    if (!nombreAlm.trim() || !pagoBase) { setMsgAlm({ tipo:"error", texto:"Completa nombre y pago base" }); return; }
    try {
      await crearAlmacen(token, { nombre: nombreAlm, ubicacion, pagoBase: parseFloat(pagoBase) });
      setNombreAlm(""); setPagoBase(""); setUbicacion("");
      setMsgAlm({ tipo:"ok", texto:"Almacén creado" });
      cargarDatos();
    } catch (e) { setMsgAlm({ tipo:"error", texto: e.message }); }
  };

  const handleEliminarAlmacen = async (id) => {
    if (!window.confirm("¿Desactivar almacén? Las asistencias se conservarán.")) return;
    try { await eliminarAlmacen(token, id); cargarDatos(); } catch (e) { alert(e.message); }
  };

  const handleReactivarAlmacen = async (id) => {
    try { await reactivarAlmacen(token, id); cargarDatos(); } catch (e) { alert(e.message); }
  };

  const verHistorial = async (usuario) => {
    setTrab(usuario); setVista(VISTA.HISTORIAL); setLoadingHist(true);
    try { const d = await getMisAsistenciasDeUsuario(token, usuario.id); setHistorial(d || []); }
    catch { setHistorial([]); } finally { setLoadingHist(false); }
  };

  const handlePagoCompleto = async (uid) => {
    if (!window.confirm("¿Confirmar pago completo? Las asistencias pasarán a estado PAGADO y el trabajador recibirá una notificación.")) return;
    try {
      await marcarPagoCompleto(token, uid);
      setMsgPago(p => ({ ...p, [uid]: "ok" }));
      cargarDatos();
      setTimeout(() => setMsgPago(p => { const n={...p}; delete n[uid]; return n; }), 3000);
    } catch (e) { alert(e.message); }
  };

  const handleAdelanto = async (uid, monto) => {
    await registrarAdelanto(token, uid, monto);
    setMsgPago(p => ({ ...p, [uid+"_a"]: "ok" }));
    setTimeout(() => setMsgPago(p => { const n={...p}; delete n[uid+"_a"]; return n; }), 3000);
  };

  const exportarExcel = () => {
    if (!trab || historial.length === 0) return;
    const rep = reporte.find(r => r.usuario === trab.usuario);
    const datos = historial.map(a => ({ Fecha: a.fecha, "Almacén": a.almacen?.nombre||"—", "Pago (S/.)": Number(a.pagoDia).toFixed(2), Estado: a.estado||"—" }));
    datos.push({}, { Fecha:"Total pendiente","Pago (S/.)": Number(rep?.totalGanado||0).toFixed(2) }, { Fecha:"Pagos extra","Pago (S/.)": Number(rep?.pagosExtra||0).toFixed(2) }, { Fecha:"Adelantos descontados","Pago (S/.)": `-${Number(rep?.adelantos||0).toFixed(2)}` }, { Fecha:"NETO A PAGAR","Pago (S/.)": Number(rep?.neto||0).toFixed(2) });
    const ws = XLSX.utils.json_to_sheet(datos);
    ws["!cols"] = [{wch:14},{wch:22},{wch:14},{wch:14}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");
    XLSX.writeFile(wb, `historial_${trab.usuario}.xlsx`);
  };

  useEffect(() => { if (!token) { window.location.href="/"; return; } cargarDatos(); }, []);

  // ─── VISTA HISTORIAL ─────────────────────────────────
  if (vista === VISTA.HISTORIAL && trab) {
    const rep = reporte.find(r => r.usuario === trab.usuario);
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.headerLeft}>
            <button onClick={() => setVista(VISTA.TRABAJADORES)} style={s.btnVolver}>← Volver</button>
            <div><h1 style={s.headerTitle}>👷 {trab.usuario}</h1><p style={s.headerSub}>Historial de asistencias</p></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={exportarExcel} disabled={historial.length===0} style={s.btnExcel}>📥 Excel</button>
            <button onClick={cerrarSesion} style={s.btnCerrar}>Cerrar sesión</button>
          </div>
        </div>
        <div style={s.statsRow}>
          <StatBox label="Días pendientes" valor={rep?.diasTrabajados||0} emoji="📅" color="#2563eb"/>
          <StatBox label="Total asistencias" valor={`S/. ${Number(rep?.totalGanado||0).toFixed(2)}`} emoji="💵" color="#16a34a"/>
          <StatBox label="Pagos extra" valor={`S/. ${Number(rep?.pagosExtra||0).toFixed(2)}`} emoji="➕" color="#d97706"/>
          <StatBox label="Adelantos desc." valor={`-S/. ${Number(rep?.adelantos||0).toFixed(2)}`} emoji="↩️" color="#dc2626"/>
          <StatBox label="Neto a pagar" valor={`S/. ${Number(rep?.neto||0).toFixed(2)}`} emoji="💰" color="#7c3aed"/>
        </div>
        <div style={s.card}>
          <h2 style={s.cardTitle}>📋 Asistencias</h2>
          {loadingHist ? <p style={s.empty}>Cargando...</p> : historial.length===0 ? <p style={s.empty}>Sin asistencias.</p> : (
            <table style={s.table}><thead><tr><th style={s.th}>Fecha</th><th style={s.th}>Almacén</th><th style={s.th}>Pago</th><th style={s.th}>Estado</th></tr></thead>
              <tbody>{historial.map((a,i) => (
                <tr key={i} style={i%2===0?s.trEven:{}}>
                  <td style={s.td}>{a.fecha}</td>
                  <td style={s.td}>{a.almacen?.nombre||"—"}</td>
                  <td style={{...s.td, color:a.estado==="PAGADO"?"#9ca3af":"#374151", textDecoration:a.estado==="PAGADO"?"line-through":"none"}}>S/. {Number(a.pagoDia).toFixed(2)}</td>
                  <td style={s.td}><span style={estadoBadge(a.estado)}>{a.estado||"—"}</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ─── VISTA TRABAJADORES ──────────────────────────────
  if (vista === VISTA.TRABAJADORES) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.headerLeft}>
            <button onClick={() => setVista(VISTA.PANEL)} style={s.btnVolver}>← Volver</button>
            <div><h1 style={s.headerTitle}>👷 Trabajadores</h1><p style={s.headerSub}>{usuarios.length} activo{usuarios.length!==1?"s":""}</p></div>
          </div>
          <button onClick={cerrarSesion} style={s.btnCerrar}>Cerrar sesión</button>
        </div>
        <div style={s.card}>
          {usuarios.length===0 ? <p style={s.empty}>Sin trabajadores.</p> : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {usuarios.map(u => {
                const rep = reporte.find(r => r.usuario === u.usuario);
                return (
                  <div key={u.id} style={s.trabCard}>
                    <div style={s.trabInfo}>
                      <div style={s.trabAvatar}>{u.usuario[0].toUpperCase()}</div>
                      <div>
                        <p style={s.trabNombre}>{u.usuario}</p>
                        <p style={s.trabMeta}>{rep ? `${rep.diasTrabajados} días pend. · S/. ${Number(rep.neto).toFixed(2)} neto` : "Sin asistencias"}</p>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {msgPago[u.id]     && <span style={s.msgOkInline}>✓ Pago registrado</span>}
                      {msgPago[u.id+"_a"]&& <span style={s.msgOkInline}>✓ Adelanto enviado</span>}
                      <button onClick={() => verHistorial(u)}            style={s.btnHistorial}>📋 Historial</button>
                      <button onClick={() => setModalAdelanto(u)}        style={s.btnAdelanto}>💵 Adelanto</button>
                      <button onClick={() => handlePagoCompleto(u.id)}   style={s.btnPago}>✅ Ya pagué</button>
                      <button onClick={() => handleEliminarUsuario(u.id)} style={s.btnDelete}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── VISTA INACTIVOS ─────────────────────────────────
  if (vista === VISTA.INACTIVOS) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.headerLeft}>
            <button onClick={() => setVista(VISTA.PANEL)} style={s.btnVolver}>← Volver</button>
            <div><h1 style={s.headerTitle}>🔄 Reactivar</h1><p style={s.headerSub}>Usuarios y almacenes desactivados</p></div>
          </div>
          <button onClick={cerrarSesion} style={s.btnCerrar}>Cerrar sesión</button>
        </div>

        <div style={s.card}>
          <h2 style={s.cardTitle}>👤 Usuarios desactivados ({inacUsuarios.length})</h2>
          {inacUsuarios.length===0 ? <p style={s.empty}>Ninguno desactivado.</p> : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {inacUsuarios.map(u => (
                <div key={u.id} style={s.listItem}>
                  <div><span style={s.listName}>{u.usuario}</span><span style={s.listSub}> · {u.rol}</span></div>
                  <button onClick={() => handleReactivarUsuario(u.id)} style={s.btnReactivar}>↩ Reactivar</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={s.card}>
          <h2 style={s.cardTitle}>🏢 Almacenes desactivados ({inacAlmacenes.length})</h2>
          {inacAlmacenes.length===0 ? <p style={s.empty}>Ninguno desactivado.</p> : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {inacAlmacenes.map(a => (
                <div key={a.id} style={s.listItem}>
                  <div><span style={s.listName}>{a.nombre}</span>{a.ubicacion&&<span style={s.listSub}> · {a.ubicacion}</span>}<span style={s.listSub}> · S/. {a.pagoBase}</span></div>
                  <button onClick={() => handleReactivarAlmacen(a.id)} style={s.btnReactivar}>↩ Reactivar</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PANEL PRINCIPAL ─────────────────────────────────
  return (
    <div style={s.page}>
      {modalAdelanto && <ModalAdelanto usuario={modalAdelanto} onClose={() => setModalAdelanto(null)} onConfirm={(m) => handleAdelanto(modalAdelanto.id, m)} />}

      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.headerIcon}>👑</span>
          <div><h1 style={s.headerTitle}>Panel Administrador</h1><p style={s.headerSub}>Gestión de trabajadores y almacenes</p></div>
        </div>
        <button onClick={cerrarSesion} style={s.btnCerrar}>Cerrar sesión</button>
      </div>

      <div style={s.statsRow}>
        <StatBox label="Trabajadores activos" valor={usuarios.length} emoji="👷" color="#2563eb"/>
        <StatBox label="Almacenes activos" valor={almacenes.length} emoji="🏢" color="#16a34a"/>
        <StatBox label="Neto total" valor={`S/. ${reporte.reduce((a,r)=>a+(r.neto||0),0).toFixed(2)}`} emoji="💰" color="#d97706"/>
      </div>

      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <button onClick={() => setVista(VISTA.TRABAJADORES)} style={{...s.btnAcceso,flex:1}}>👷 Ver trabajadores</button>
        <button onClick={() => setVista(VISTA.INACTIVOS)}    style={{...s.btnAccesoGris,flex:1}}>
          🔄 Reactivar {(inacUsuarios.length+inacAlmacenes.length)>0?`(${inacUsuarios.length+inacAlmacenes.length} pendientes)`:""}
        </button>
      </div>

      <div style={s.grid}>
        <div style={s.card}>
          <h2 style={s.cardTitle}>👤 Crear usuario</h2>
          <label style={s.label}>Usuario</label>
          <input style={s.input} placeholder="Nombre" value={nuevoUsuario} onChange={e=>setNuevoUsuario(e.target.value)}/>
          <label style={s.label}>Contraseña</label>
          <input style={s.input} type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)}/>
          <label style={s.label}>Rol</label>
          <select style={s.select} value={rol} onChange={e=>setRol(e.target.value)}>
            <option value="USER">Trabajador (USER)</option>
            <option value="ADMIN">Administrador (ADMIN)</option>
          </select>
          {msgUsu && <div style={msgUsu.tipo==="ok"?s.msgOk:s.msgError}>{msgUsu.texto}</div>}
          <button onClick={handleCrearUsuario} style={s.btnPrimary}>+ Crear usuario</button>
        </div>

        <div style={s.card}>
          <h2 style={s.cardTitle}>🏢 Gestión de almacenes</h2>
          <label style={s.label}>Nombre</label>
          <input style={s.input} placeholder="Nombre del almacén" value={nombreAlm} onChange={e=>setNombreAlm(e.target.value)}/>
          <label style={s.label}>Ubicación</label>
          <input style={s.input} placeholder="Dirección o referencia" value={ubicacion} onChange={e=>setUbicacion(e.target.value)}/>
          <label style={s.label}>Pago base (S/.)</label>
          <input style={s.input} type="number" min="0" placeholder="0.00" value={pagoBase} onChange={e=>setPagoBase(e.target.value)}/>
          {msgAlm && <div style={msgAlm.tipo==="ok"?s.msgOk:s.msgError}>{msgAlm.texto}</div>}
          <button onClick={handleCrearAlmacen} style={s.btnSuccess}>+ Crear almacén</button>
          <div style={{marginTop:16}}>
            <p style={{fontSize:12,fontWeight:700,color:"#6b7280",marginBottom:8}}>ALMACENES ACTIVOS</p>
            {almacenes.length===0 && <p style={s.empty}>Sin almacenes</p>}
            {almacenes.map(a => (
              <div key={a.id} style={s.listItem}>
                <div><span style={s.listName}>{a.nombre}</span>{a.ubicacion&&<span style={s.listSub}> · {a.ubicacion}</span>}<span style={s.listSub}> · S/. {a.pagoBase}</span></div>
                <button onClick={() => handleEliminarAlmacen(a.id)} style={s.btnDelete}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.card}>
        <h2 style={s.cardTitle}>📊 Reporte general</h2>
        {reporte.length===0 ? <p style={s.empty}>Sin datos</p> : (
          <table style={s.table}>
            <thead><tr>
              <th style={s.th}>Trabajador</th><th style={s.th}>Días pend.</th>
              <th style={s.th}>Total asist.</th><th style={s.th}>Pagos extra</th>
              <th style={s.th}>Adelantos</th><th style={s.th}>Neto a pagar</th>
            </tr></thead>
            <tbody>{reporte.map((r,i) => (
              <tr key={r.usuario} style={i%2===0?s.trEven:{}}>
                <td style={s.td}><strong>{r.usuario}</strong></td>
                <td style={s.td}>{r.diasTrabajados}</td>
                <td style={s.td}>S/. {Number(r.totalGanado).toFixed(2)}</td>
                <td style={{...s.td,color:"#16a34a",fontWeight:600}}>+ S/. {Number(r.pagosExtra||0).toFixed(2)}</td>
                <td style={{...s.td,color:"#dc2626",fontWeight:600}}>- S/. {Number(r.adelantos||0).toFixed(2)}</td>
                <td style={{...s.td,fontWeight:700,color:"#1d4ed8"}}>S/. {Number(r.neto).toFixed(2)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, valor, emoji, color }) {
  return (
    <div style={{...s.statBox, borderTop:`3px solid ${color}`}}>
      <span style={{fontSize:22}}>{emoji}</span>
      <div><p style={{margin:0,fontSize:20,fontWeight:700,color}}>{valor}</p><p style={{margin:0,fontSize:12,color:"#888"}}>{label}</p></div>
    </div>
  );
}

const estadoBadge = (estado) => {
  const base = {fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99};
  const c = {REGISTRADO:{background:"#e0f2fe",color:"#0369a1"},VALIDADO:{background:"#dcfce7",color:"#15803d"},PAGADO:{background:"#f1f5f9",color:"#6b7280"}};
  return {...base,...(c[estado]||{background:"#f1f5f9",color:"#475569"})};
};

const s = {
  page:        {minHeight:"100vh",background:"#f0f2f5",padding:"20px 16px",fontFamily:"Arial, sans-serif",maxWidth:1000,margin:"0 auto"},
  header:      {background:"#fff",borderRadius:14,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"},
  headerLeft:  {display:"flex",alignItems:"center",gap:12},
  headerIcon:  {fontSize:28},
  headerTitle: {margin:0,fontSize:18,fontWeight:700,color:"#1a1a2e"},
  headerSub:   {margin:0,fontSize:13,color:"#888"},
  btnCerrar:   {background:"#ef4444",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13},
  btnVolver:   {background:"#f1f5f9",color:"#374151",border:"1px solid #e5e7eb",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13},
  btnExcel:    {background:"#16a34a",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13},
  btnAcceso:   {padding:"14px",background:"#1d4ed8",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer"},
  btnAccesoGris:{padding:"14px",background:"#f1f5f9",color:"#374151",border:"1px solid #e5e7eb",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer"},
  btnReactivar:{background:"#f0fdf4",color:"#166534",border:"1px solid #bbf7d0",padding:"6px 14px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13},
  btnHistorial:{background:"#eff6ff",color:"#1d4ed8",border:"1px solid #bfdbfe",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12},
  btnAdelanto: {background:"#fffbeb",color:"#92400e",border:"1px solid #fde68a",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12},
  btnPago:     {background:"#f0fdf4",color:"#166534",border:"1px solid #bbf7d0",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12},
  btnDelete:   {background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontWeight:700,fontSize:12},
  btnPrimary:  {width:"100%",padding:"10px",background:"#2563eb",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:4},
  btnSuccess:  {width:"100%",padding:"10px",background:"#16a34a",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:4},
  statsRow:    {display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))",gap:12,marginBottom:16},
  statBox:     {background:"#fff",borderRadius:12,padding:"16px 18px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"},
  grid:        {display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:16,marginBottom:16},
  card:        {background:"#fff",borderRadius:14,padding:"20px 22px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginBottom:16},
  cardTitle:   {margin:"0 0 16px",fontSize:16,fontWeight:700,color:"#1a1a2e"},
  label:       {display:"block",fontSize:12,fontWeight:600,color:"#555",marginBottom:5},
  input:       {width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:14,marginBottom:10,boxSizing:"border-box"},
  select:      {width:"100%",padding:"9px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:14,marginBottom:10,boxSizing:"border-box",background:"#fff"},
  listItem:    {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",border:"1px solid #f1f5f9",borderRadius:8,marginBottom:6,background:"#fafafa"},
  listName:    {fontSize:14,fontWeight:600,color:"#1a1a2e"},
  listSub:     {fontSize:12,color:"#888"},
  trabCard:    {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",border:"1px solid #e5e7eb",borderRadius:10,background:"#fafafa",flexWrap:"wrap",gap:10},
  trabInfo:    {display:"flex",alignItems:"center",gap:12},
  trabAvatar:  {width:40,height:40,borderRadius:"50%",background:"#1d4ed8",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,flexShrink:0},
  trabNombre:  {margin:0,fontSize:15,fontWeight:700,color:"#1a1a2e"},
  trabMeta:    {margin:0,fontSize:12,color:"#888",marginTop:2},
  msgOkInline: {fontSize:12,color:"#166534",background:"#f0fdf4",border:"1px solid #bbf7d0",padding:"4px 10px",borderRadius:6,fontWeight:600},
  msgOk:       {background:"#f0fdf4",color:"#166534",border:"1px solid #bbf7d0",borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:10},
  msgError:    {background:"#fff0f0",color:"#c0392b",border:"1px solid #f5c6cb",borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:10},
  table:       {width:"100%",borderCollapse:"collapse",fontSize:14},
  th:          {textAlign:"left",padding:"10px 12px",borderBottom:"2px solid #e5e7eb",fontSize:12,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.04em"},
  td:          {padding:"10px 12px",borderBottom:"1px solid #f1f5f9",color:"#374151"},
  trEven:      {background:"#f9fafb"},
  empty:       {color:"#9ca3af",fontSize:14,textAlign:"center",padding:"20px 0"},
};