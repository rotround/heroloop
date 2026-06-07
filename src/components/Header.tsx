import { LogIn, LogOut, ShieldCheck, UserPlus, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "../lib/types";

interface HeaderProps {
  user: User | null;
  profile: Profile | null;
  onLogin: () => void;
  onLogout: () => void;
  onRequestAccess: () => void;
}

export function Header({ user, profile, onLogin, onLogout, onRequestAccess }: HeaderProps) {
  const canAccessDashboard = ["owner", "admin", "contributor"].includes(profile?.role ?? "");

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="HeroLoop - página inicial">
        <span className="brand-mark"><Zap size={20} fill="currentColor" /></span>
        <span>HeroLoop</span>
      </Link>

      <nav className="header-actions" aria-label="Navegação principal">
        {canAccessDashboard && (
          <Link className="ghost-button" to="/dashboard">
            <ShieldCheck size={17} /> Dashboard
          </Link>
        )}
        {user && profile?.role === "user" && !profile.access_requested && (
          <button className="ghost-button" type="button" onClick={onRequestAccess}>
            <UserPlus size={17} /> Colaborar
          </button>
        )}
        {user && profile?.access_requested && <span className="request-status">Solicitação enviada</span>}
        {user ? (
          <button className="ghost-button" type="button" onClick={onLogout}>
            <LogOut size={17} /> Sair
          </button>
        ) : (
          <button className="primary-button compact" type="button" onClick={onLogin}>
            <LogIn size={17} /> Entrar
          </button>
        )}
      </nav>
    </header>
  );
}
