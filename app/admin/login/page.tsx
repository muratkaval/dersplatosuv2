"use client";

import { useActionState } from "react";
import { loginAction } from "../lib/auth";

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, null);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #050b1f 0%, #0d1f3d 100%)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .ms { font-family: 'Material Symbols Outlined'; font-size: 18px; line-height: 1; vertical-align: middle; }
        label { display: block; font-size: 0.75rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        input { width: 100%; padding: 10px 12px; background: #0b1221; border: 1.5px solid #1e3a5f; border-radius: 8px; color: #f1f5f9; font-size: 0.875rem; font-family: inherit; outline: none; transition: border-color 0.2s; }
        input:focus { border-color: #3b82f6; }
        .fg { margin-bottom: 14px; text-align: left; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; font-family: inherit; background: #3b82f6; color: #fff; width: 100%; transition: background 0.2s; }
        .btn:hover { background: #2563eb; }
        .err { color: #f87171; font-size: 0.82rem; margin-top: 8px; text-align: left; }
      `}</style>

      <div style={{
        background: "#0f1a2e",
        border: "1px solid #1e3a5f",
        borderRadius: "20px",
        padding: "40px",
        width: "100%",
        maxWidth: "380px",
        textAlign: "center",
      }}>
        <span className="ms" style={{ fontSize: "2.5rem", color: "#3b82f6" }}>school</span>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", margin: "10px 0 4px" }}>
          Ders Platosu
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.84rem", marginBottom: "28px" }}>Admin Paneli</p>

        <form action={formAction}>
          <div className="fg">
            <label>E-posta veya Kullanıcı Adı</label>
            <input type="text" name="identifier" placeholder="admin@site.com" autoComplete="username" required />
          </div>
          <div className="fg">
            <label>Şifre</label>
            <input type="password" name="password" placeholder="••••••••" autoComplete="current-password" required />
          </div>
          {state?.error && <p className="err">{state.error}</p>}
          <button type="submit" className="btn" style={{ marginTop: "8px" }}>
            <span className="ms">login</span>
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}
