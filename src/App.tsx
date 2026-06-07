import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { Header } from "./components/Header";
import { supabase } from "./lib/supabase";
import type { Profile } from "./lib/types";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";

function AppRoutes() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    async function syncUser(nextUser: User | null) {
      if (!active) return;
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", nextUser.id).single();
      if (active) setProfile(data as Profile | null);
    }

    void supabase.auth.getUser().then(({ data }) => syncUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncUser(session?.user ?? null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  async function requestAccess() {
    const message = window.prompt("Conte brevemente como deseja colaborar com o HeroLoop:");
    if (message === null) return;
    const { error } = await supabase.rpc("request_contributor_access", { request_message: message });
    if (error) window.alert(error.message);
    else {
      window.alert("Solicitação enviada ao owner.");
      window.location.reload();
    }
  }

  return (
    <>
      <Header user={user} profile={profile} onLogin={() => navigate("/login")} onLogout={logout} onRequestAccess={requestAccess} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage user={user} />} />
        <Route path="/dashboard" element={<DashboardPage user={user} profile={profile} />} />
      </Routes>
      <footer>
        <strong>HeroLoop</strong>
        <p>Guia não oficial feito por fãs. Marvel Future Fight e suas marcas pertencem aos respectivos proprietários.</p>
      </footer>
    </>
  );
}

export function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
