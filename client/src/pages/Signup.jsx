import { useState } from "react";
import { BASE_URL, readJson } from "../api";
import { ArenaIcon, ArenaShell } from "../components/ArenaShell";

function Signup({ onLoginClick, onSignupSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await readJson(res);

      if (!res.ok) {
        setError(data.message || "Signup failed");
        return;
      }

      localStorage.setItem("token", data.token);

      if (onSignupSuccess) {
        onSignupSuccess();
      }

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
          <span>Already registered?</span>
          <button className="arena-outline-button" onClick={onLoginClick} type="button">
            Log in
          </button>
        </div>
      }
    >
      <section className="auth-panel" aria-labelledby="signup-title">
        <div className="auth-panel__badge">
          <ArenaIcon name="brand" />
        </div>

        <p className="auth-panel__eyebrow">Create Account</p>
        <h2 id="signup-title">Set up your interview arena</h2>
        <p className="auth-panel__copy">
          Save your progress, resume insights, and performance reports.
        </p>

        <form className="auth-form" onSubmit={handleSignup}>
          <label>
            <span>Name</span>
            <input
              autoComplete="name"
              className="auth-input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

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
              autoComplete="new-password"
              className="auth-input"
              placeholder="Create password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <div className="auth-alert">{error}</div>}

          <button className="auth-submit" disabled={loading} type="submit">
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </section>
    </ArenaShell>
  );
}

export default Signup;
