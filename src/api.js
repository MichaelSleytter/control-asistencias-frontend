const API = "https://control-asistencias-production.up.railway.app";

const h  = (token) => ({ Authorization: "Bearer " + token });
const hj = (token) => ({ "Content-Type": "application/json", Authorization: "Bearer " + token });

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const login = async (usuario, password) => {
  const res  = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usuario, password }) });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");
  return data;
};

// ─── USUARIOS ────────────────────────────────────────────────────────────────
export const getUsuarios         = (token)         => fetch(`${API}/admin/usuarios`,            { headers: h(token)  }).then(r => r.json());
export const getUsuariosInactivos= (token)         => fetch(`${API}/admin/usuarios/inactivos`,  { headers: h(token)  }).then(r => r.json());
export const crearUsuario        = (token, body)   => fetch(`${API}/admin/crear`,               { method:"POST", headers: hj(token), body: JSON.stringify(body) }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); });
export const eliminarUsuario     = (token, id)     => fetch(`${API}/admin/eliminar/${id}`,      { method:"DELETE", headers: h(token) }).then(async r => { if (!r.ok) throw new Error(await r.text()); });
export const reactivarUsuario    = (token, id)     => fetch(`${API}/admin/reactivar/usuario/${id}`, { method:"PUT", headers: h(token) }).then(async r => { if (!r.ok) throw new Error(await r.text()); });

// ─── ALMACENES ───────────────────────────────────────────────────────────────
export const getAlmacenes        = (token)         => fetch(`${API}/admin/almacenes`,           { headers: h(token) }).then(r => r.json());
export const getAlmacentesPublic = (token)         => fetch(`${API}/public/almacenes`,          { headers: h(token) }).then(r => r.json());
export const getAlmacenesInactivos=(token)         => fetch(`${API}/admin/almacenes/inactivos`, { headers: h(token) }).then(r => r.json());
export const crearAlmacen        = (token, body)   => fetch(`${API}/admin/almacenes`,           { method:"POST", headers: hj(token), body: JSON.stringify(body) }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); });
export const eliminarAlmacen     = (token, id)     => fetch(`${API}/admin/almacenes/${id}`,     { method:"DELETE", headers: h(token) }).then(async r => { if (!r.ok) throw new Error(await r.text()); });
export const reactivarAlmacen    = (token, id)     => fetch(`${API}/admin/reactivar/almacen/${id}`, { method:"PUT", headers: h(token) }).then(async r => { if (!r.ok) throw new Error(await r.text()); });

// ─── ASISTENCIAS ─────────────────────────────────────────────────────────────
export const getMisAsistencias        = (token)          => fetch(`${API}/asistencias/mis`,              { headers: h(token) }).then(r => r.json());
export const getMiTotal               = (token)          => fetch(`${API}/asistencias/mi-total`,         { headers: h(token) }).then(r => r.json());
export const registrarAsistencia      = (token, almId)   => fetch(`${API}/asistencias/almacen?almacenId=${almId}`, { method:"POST", headers: h(token) }).then(async r => { if (!r.ok) throw new Error(await r.text()); });
export const getMisAsistenciasDeUsuario=(token, uid)     => fetch(`${API}/admin/usuarios/${uid}/asistencias`, { headers: h(token) }).then(r => r.json());

// ─── PAGOS EXTRA ─────────────────────────────────────────────────────────────
export const registrarPagoExtra = (token, motivo, monto) =>
  fetch(`${API}/asistencias/pago-extra`, { method:"POST", headers: hj(token), body: JSON.stringify({ motivo, monto }) })
    .then(async r => { if (!r.ok) throw new Error(await r.text()); });

// ─── PAGO / ADELANTO (ADMIN) ─────────────────────────────────────────────────
export const marcarPagoCompleto  = (token, uid)          => fetch(`${API}/admin/usuarios/${uid}/pago-completo`, { method:"POST", headers: h(token) }).then(async r => { if (!r.ok) throw new Error(await r.text()); });
export const registrarAdelanto   = (token, uid, monto)   => fetch(`${API}/admin/usuarios/${uid}/adelanto`,     { method:"POST", headers: hj(token), body: JSON.stringify({ monto }) }).then(async r => { if (!r.ok) throw new Error(await r.text()); });

// ─── NOTIFICACIONES (ESTIBADOR) ──────────────────────────────────────────────
export const getNotificaciones   = (token)               => fetch(`${API}/asistencias/notificaciones`,              { headers: h(token) }).then(r => r.json());
export const confirmarNotif      = (token, id)           => fetch(`${API}/asistencias/notificaciones/${id}/confirmar`, { method:"POST", headers: h(token) }).then(async r => { if (!r.ok) throw new Error(await r.text()); });

// ─── REPORTE ─────────────────────────────────────────────────────────────────
export const getReporte          = (token)               => fetch(`${API}/admin/reportes/usuarios`, { headers: h(token) }).then(r => r.json());