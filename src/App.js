import { useState } from "react";
import Login from "./Login";
import UserDashboard from "./UserDashboard";
import AdminDashboard from "./AdminDashboard";

function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem("token"));
  const [rol, setRol] = useState(localStorage.getItem("rol"));

  const handleLogin = (rolRecibido) => {
    setRol(rolRecibido);
    setLogged(true);
  };

  if (!logged) return <Login onLogin={handleLogin} />;

  return rol === "ADMIN" ? <AdminDashboard /> : <UserDashboard />;
}

export default App;