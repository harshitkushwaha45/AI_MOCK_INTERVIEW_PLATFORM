import { useState } from "react";
import { BASE_URL } from "../api";

function Login({ onSignupClick, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      onLoginSuccess();

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Welcome Back 👋</h2>

        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="button" onClick={handleLogin}>
          Login
        </button>

        <p style={{ marginTop: "15px" }}>
          Don’t have an account?{" "}
          <span className="link" onClick={onSignupClick}>
            Signup
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;