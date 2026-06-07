import { ArrowLeft, Chrome, LockKeyhole, Mail, Zap } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface LoginPageProps {
  user: User | null;
}

export function LoginPage({ user }: LoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/login` } });
    setLoading(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup") setMessage("Conta criada. Verifique seu email para confirmar o cadastro.");
    else navigate("/dashboard");
  }

  async function googleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <main className="login-page">
      <div className="login-glow" />
      <form className="login-card" onSubmit={submit}>
        <Link className="back-link" to="/"><ArrowLeft size={16} /> Voltar</Link>
        <span className="login-logo"><Zap fill="currentColor" /></span>
        <h1>{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <p>{mode === "login" ? "Acesse sua conta HeroLoop." : "Crie sua conta para solicitar acesso de colaborador."}</p>
        <label><span>Email</span><div><Mail size={17} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" /></div></label>
        <label><span>Senha</span><div><LockKeyhole size={17} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Sua senha" /></div></label>
        {message && <div className="form-message">{message}</div>}
        <button className="primary-button login-submit" type="submit" disabled={loading}>{loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}</button>
        <div className="login-divider"><span>ou</span></div>
        <button className="google-button" type="button" onClick={googleLogin}><Chrome size={18} /> Continuar com Google</button>
        <button className="switch-mode" type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Não possui conta? Criar conta" : "Já possui conta? Entrar"}
        </button>
      </form>
    </main>
  );
}
