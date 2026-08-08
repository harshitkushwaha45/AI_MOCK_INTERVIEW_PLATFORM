import { useState } from "react";
import { BASE_URL, readJson } from "../api";
import { ArenaIcon, ArenaShell } from "../components/ArenaShell";

function Login({ onSignupClick, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await readJson(res);

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      onLoginSuccess();

    } catch (err) {
      console.error(err);
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ArenaShell
      rightAction={
        <div className="arena-auth-switch">
          <span>New here?</span>
          <button className="arena-outline-button" onClick={onSignupClick} type="button">
            Sign up
          </button>
        </div>
      }
    >
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-panel__badge">
          <ArenaIcon name="brand" />
        </div>

        <p className="auth-panel__eyebrow">Welcome Back</p>
        <h2 id="login-title">Log in to start practicing</h2>
        <p className="auth-panel__copy">
          Continue to resume analysis, personalized questions, and instant feedback.
        </p>

        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              className="auth-input"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              className="auth-input"
              placeholder="Enter password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <div className="auth-alert">{error}</div>}

          <button className="auth-submit" disabled={loading} type="submit">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </ArenaShell>
  );
}

export default Login;
