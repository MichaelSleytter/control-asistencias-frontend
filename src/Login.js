import { useState } from "react";
import { login } from "./api";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!usuario.trim() || !password.trim()) {
      setError("Completa usuario y contraseña");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await login(usuario, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("rol", data.rol);
      onLogin(data.rol);
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <span style={styles.icon}>🏗️</span>
        </div>
        <h1 style={styles.title}>Sistema de Asistencias</h1>
        <p style={styles.subtitle}>Estibadores — Control de asistencia</p>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Usuario</label>
            <input
              style={styles.input}
              placeholder="Ingresa tu usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="username"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f0f2f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
    padding: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 380,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  iconWrap: { marginBottom: 12 },
  icon: { fontSize: 40 },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1a1a2e",
    margin: "0 0 4px",
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    margin: "0 0 28px",
  },
  form: { textAlign: "left" },
  field: { marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#444",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  error: {
    background: "#fff0f0",
    color: "#c0392b",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 14,
    border: "1px solid #f5c6cb",
  },
  btn: {
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  },
};