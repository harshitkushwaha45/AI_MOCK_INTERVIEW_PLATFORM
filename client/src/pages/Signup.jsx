import { useState } from "react";
import { BASE_URL } from "../api";

function Signup({ onLoginClick, onSignupSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Signup failed");
        return;
      }

      localStorage.setItem("token", data.token);
      alert("Signup successful 🎉");

      if (onSignupSuccess) {
        onSignupSuccess();
      }

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Create Account 🚀</h2>

        <input
          className="input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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

        <button className="button" onClick={handleSignup}>
          Signup
        </button>

        <p style={{ marginTop: "15px" }}>
          Already have an account?{" "}
          <span className="link" onClick={onLoginClick}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;
