import { Check, ImagePlus, LayoutDashboard, LoaderCircle, Pencil, Plus, ShieldCheck, Trash2, Upload, Users, X, Zap } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { VisualAssetPicker, type VisualAsset } from "../components/VisualAssetPicker";
import { supabase } from "../lib/supabase";
import type { AccessRequest, AdminCharacter, Ctp, Portrait, Profile } from "../lib/types";

interface DashboardPageProps {
  user: User | null;
  profile: Profile | null;
}

type DashboardView = "overview" | "create" | "characters" | "ctps" | "requests";
const initialForm = { name: "", slug: "", category: "combat", image_url: "", portrait_id: "", uniform: "", role: "DPS PvE", meta: "normal", rotation: "", ctp_id: "", youtube: "" };

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function imageExtension(type: string) {
  return type === "image/webp" ? "webp" : type === "image/jpeg" ? "jpg" : "png";
}

function youtubeId(value: string) {
  const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return match?.[1] ?? (value.length === 11 ? value : null);
}

function portraitMetadata(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "");
  const match = base.match(/^(.*?)(\d+)$/);
  return { key: match?.[1] ?? base, variant: match ? Number(match[2]) : 0 };
}

export function DashboardPage({ user, profile }: DashboardPageProps) {
  const [view, setView] = useState<DashboardView>("overview");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [portraits, setPortraits] = useState<Portrait[]>([]);
  const [ctps, setCtps] = useState<Ctp[]>([]);
  const [characters, setCharacters] = useState<AdminCharacter[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [picker, setPicker] = useState<"portrait" | "ctp" | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const allowed = ["owner", "admin", "contributor"].includes(profile?.role ?? "");
  const isOwner = profile?.role === "owner";
  const selectedCtp = useMemo(() => ctps.find((ctp) => ctp.id === form.ctp_id), [ctps, form.ctp_id]);

  const loadData = useCallback(async () => {
    const queries = [
      supabase.from("portraits").select("*").order("file_name").limit(1200),
      supabase.from("ctps").select("*").order("name"),
    ];
    const [{ data: portraitData }, { data: ctpData }] = await Promise.all(queries);
    setPortraits((portraitData ?? []) as Portrait[]);
    setCtps((ctpData ?? []) as Ctp[]);
    if (isOwner) {
      const [{ data: characterData }, { data: rotationData }, { data: recommendationData }, { data: requestData }] = await Promise.all([
        supabase.from("characters").select("id,name,slug,category,image_url,recommended_uniform,pve_role,meta_status,is_published").order("name"),
        supabase.from("rotations").select("id,character_id,rotation_text,youtube_url").eq("is_primary", true),
        supabase.from("ctp_recommendations").select("id,character_id,ctp_id,best_ctp"),
        supabase.from("access_requests").select("id,user_id,message,status,created_at,profiles!access_requests_user_id_fkey(display_name,avatar_url)").eq("status", "pending").order("created_at"),
      ]);
      setCharacters((characterData ?? []).map((character) => ({
        ...character,
        rotations: (rotationData ?? []).filter((rotation) => rotation.character_id === character.id),
        ctp_recommendations: (recommendationData ?? []).filter((recommendation) => recommendation.character_id === character.id),
      })) as unknown as AdminCharacter[]);
      setRequests((requestData ?? []) as unknown as AccessRequest[]);
    }
  }, [isOwner]);

  useEffect(() => { if (allowed) void loadData(); }, [allowed, loadData]);
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed) return <Navigate to="/" replace />;

  function update(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value, ...(field === "name" && !current.slug ? { slug: slugify(value) } : {}) }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function editCharacter(character: AdminCharacter) {
    const rotation = character.rotations?.[0];
    const recommendation = character.ctp_recommendations?.[0];
    const portrait = portraits.find((item) => item.public_url === character.image_url);
    setForm({
      name: character.name,
      slug: character.slug,
      category: character.category,
      image_url: character.image_url ?? "",
      portrait_id: portrait?.id ?? "",
      uniform: character.recommended_uniform ?? "",
      role: character.pve_role ?? "",
      meta: character.meta_status,
      rotation: rotation?.rotation_text ?? "",
      ctp_id: recommendation?.ctp_id ?? "",
      youtube: rotation?.youtube_url ?? "",
    });
    setEditingId(character.id);
    setView("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveCharacter(event: FormEvent) {
    event.preventDefault();
    if (!form.ctp_id) {
      setStatus("Escolha o melhor CTP antes de salvar.");
      setPicker("ctp");
      return;
    }
    setBusy(true); setStatus("");
    const published = isOwner;
    const payload = { name: form.name, slug: form.slug, category: form.category, image_url: form.image_url || null, recommended_uniform: form.uniform || null, pve_role: form.role, meta_status: form.meta, is_published: published };
    if (editingId) {
      const character = characters.find((item) => item.id === editingId);
      const rotation = character?.rotations?.[0];
      const recommendation = character?.ctp_recommendations?.[0];
      const results = await Promise.all([
        supabase.from("characters").update(payload).eq("id", editingId),
        rotation
          ? supabase.from("rotations").update({ rotation_text: form.rotation, youtube_url: form.youtube || null, youtube_video_id: youtubeId(form.youtube), is_published: published }).eq("id", rotation.id)
          : supabase.from("rotations").insert({ character_id: editingId, rotation_text: form.rotation, youtube_url: form.youtube || null, youtube_video_id: youtubeId(form.youtube), is_primary: true, is_published: published }),
        recommendation
          ? supabase.from("ctp_recommendations").update({ ctp_id: selectedCtp?.id, best_ctp: selectedCtp?.name }).eq("id", recommendation.id)
          : supabase.from("ctp_recommendations").insert({ character_id: editingId, ctp_id: selectedCtp?.id, best_ctp: selectedCtp?.name }),
      ]);
      const error = results.find((result) => result.error)?.error;
      setStatus(error?.message ?? "Personagem atualizado com sucesso.");
    } else {
      const { data: character, error } = await supabase.from("characters").insert(payload).select("id").single();
      if (error || !character) {
        setStatus(error?.message ?? "Erro ao cadastrar personagem.");
        setBusy(false);
        return;
      }
      const results = await Promise.all([
        supabase.from("rotations").insert({ character_id: character.id, rotation_text: form.rotation, youtube_url: form.youtube || null, youtube_video_id: youtubeId(form.youtube), is_primary: true, is_published: published }),
        supabase.from("ctp_recommendations").insert({ character_id: character.id, ctp_id: selectedCtp?.id, best_ctp: selectedCtp?.name }),
      ]);
      const childError = results.find((result) => result.error)?.error;
      setStatus(childError?.message ?? (published ? "Personagem publicado com sucesso." : "Personagem enviado como rascunho para aprovação."));
    }
    resetForm();
    await loadData();
    setBusy(false);
  }

  async function deleteCharacter(character: AdminCharacter) {
    if (!window.confirm(`Excluir ${character.name} e sua rotação? Esta ação não pode ser desfeita.`)) return;
    setBusy(true);
    const results = await Promise.all([
      supabase.from("rotations").delete().eq("character_id", character.id),
      supabase.from("ctp_recommendations").delete().eq("character_id", character.id),
    ]);
    const childError = results.find((result) => result.error)?.error;
    const { error } = childError ? { error: childError } : await supabase.from("characters").delete().eq("id", character.id);
    setStatus(error?.message ?? `${character.name} excluído.`);
    await loadData();
    setBusy(false);
  }

  async function renameCtp(ctp: Ctp) {
    const name = window.prompt("Novo nome do CTP:", ctp.name)?.trim();
    if (!name || name === ctp.name) return;
    const { error } = await supabase.from("ctps").update({ name, slug: slugify(name) }).eq("id", ctp.id);
    if (!error) await supabase.from("ctp_recommendations").update({ best_ctp: name }).eq("ctp_id", ctp.id);
    setStatus(error?.message ?? "CTP atualizado.");
    await loadData();
  }

  async function deleteCtp(ctp: Ctp) {
    if (!window.confirm(`Excluir o CTP ${ctp.name}? Personagens que usam este CTP ficarão sem recomendação.`)) return;
    setBusy(true);
    const { error: recommendationError } = await supabase.from("ctp_recommendations").delete().eq("ctp_id", ctp.id);
    const { error } = recommendationError ? { error: recommendationError } : await supabase.from("ctps").delete().eq("id", ctp.id);
    if (!error && ctp.storage_path) await supabase.storage.from("ctp-icons").remove([ctp.storage_path]);
    setStatus(error?.message ?? `CTP ${ctp.name} excluído.`);
    await loadData();
    setBusy(false);
  }

  async function uploadPortrait(name: string, image: File): Promise<VisualAsset> {
    const fileName = `${slugify(name)}-${Date.now()}.${imageExtension(image.type)}`;
    const { error: uploadError } = await supabase.storage.from("portraits").upload(fileName, image, { contentType: image.type, upsert: true });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from("portraits").getPublicUrl(fileName);
    const meta = portraitMetadata(fileName);
    const { data, error } = await supabase.from("portraits").insert({ storage_path: fileName, file_name: name, character_key: meta.key, variant_number: meta.variant, public_url: urlData.publicUrl }).select().single();
    if (error) throw error;
    const portrait = data as Portrait;
    setPortraits((current) => [...current, portrait].sort((a, b) => a.file_name.localeCompare(b.file_name)));
    return { id: portrait.id, label: portrait.file_name, imageUrl: portrait.public_url };
  }

  async function uploadCtp(name: string, image: File): Promise<VisualAsset> {
    const slug = slugify(name);
    const fileName = `${slug}-${Date.now()}.${imageExtension(image.type)}`;
    const previous = ctps.find((ctp) => ctp.slug === slug);
    const { error: uploadError } = await supabase.storage.from("ctp-icons").upload(fileName, image, { contentType: image.type, upsert: true });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from("ctp-icons").getPublicUrl(fileName);
    const { data, error } = await supabase.from("ctps").upsert({ name, slug, storage_path: fileName, image_url: urlData.publicUrl }, { onConflict: "slug" }).select().single();
    if (error) throw error;
    if (previous?.storage_path && previous.storage_path !== fileName) await supabase.storage.from("ctp-icons").remove([previous.storage_path]);
    const ctp = data as Ctp;
    setCtps((current) => [...current.filter((item) => item.id !== ctp.id), ctp].sort((a, b) => a.name.localeCompare(b.name)));
    return { id: ctp.id, label: ctp.name, imageUrl: ctp.image_url };
  }

  async function importZip(file: File) {
    setBusy(true); setStatus("Preparando retratos...");
    try {
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((entry) => !entry.dir && /\.(png|jpe?g|webp)$/i.test(entry.name));
      let imported = 0;
      for (const entry of entries) {
        const fileName = entry.name.split("/").pop()!;
        const extension = fileName.split(".").pop()?.toLowerCase();
        const contentType = extension === "webp" ? "image/webp" : extension === "jpg" || extension === "jpeg" ? "image/jpeg" : "image/png";
        const bytes = await entry.async("uint8array");
        const { error } = await supabase.storage.from("portraits").upload(fileName, bytes, { contentType, upsert: true });
        if (!error) {
          const { data } = supabase.storage.from("portraits").getPublicUrl(fileName);
          const meta = portraitMetadata(fileName);
          await supabase.from("portraits").upsert({ storage_path: fileName, file_name: fileName, character_key: meta.key, variant_number: meta.variant, public_url: data.publicUrl }, { onConflict: "storage_path" });
          imported += 1;
          if (imported % 25 === 0) setStatus(`Importando retratos: ${imported}/${entries.length}`);
        }
      }
      setStatus(`${imported} retratos importados.`);
      await loadData();
    } catch (error) {
      setStatus(`Falha ao ler o ZIP: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    } finally {
      setBusy(false);
    }
  }

  async function review(id: string, decision: "approved" | "rejected") {
    await supabase.rpc("review_access_request", { request_id: id, decision });
    await loadData();
  }

  const navItems = [
    { id: "overview" as const, label: "Visão geral", icon: LayoutDashboard },
    { id: "create" as const, label: "Novo personagem", icon: Plus },
    ...(isOwner ? [
      { id: "characters" as const, label: "Personagens", icon: Users },
      { id: "ctps" as const, label: "CTPs", icon: Zap },
      { id: "requests" as const, label: "Solicitações", icon: ShieldCheck },
    ] : []),
  ];

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <p className="eyebrow">Gerenciar</p>
        <nav>{navItems.map((item) => <button className={view === item.id ? "active" : ""} key={item.id} type="button" onClick={() => { setView(item.id); setStatus(""); }}><item.icon size={17} /> {item.label}{item.id === "requests" && requests.length > 0 && <b>{requests.length}</b>}</button>)}</nav>
      </aside>
      <div className="dashboard-content">
        <div className="dashboard-title"><div><p className="eyebrow">Dashboard · {profile?.role}</p><h1>Gerenciar HeroLoop</h1></div>{busy && <LoaderCircle className="spin" />}</div>
        {status && <div className="dashboard-notice">{status}</div>}

        {view === "overview" && (
          <>
            <div className="admin-summary">
              <article><Users /><strong>{characters.length}</strong><span>Personagens</span></article>
              <article><Zap /><strong>{ctps.length}</strong><span>CTPs</span></article>
              <article><ImagePlus /><strong>{portraits.length}</strong><span>Retratos</span></article>
              <article><ShieldCheck /><strong>{requests.length}</strong><span>Solicitações</span></article>
            </div>
            {isOwner && <section className="admin-section"><div className="admin-section-heading"><div><ImagePlus /><div><h2>Biblioteca de retratos</h2><p>Importe um pacote completo ou adicione imagens ao escolher um retrato.</p></div></div><label className="upload-button"><Upload size={17} /> Importar portraits.zip<input type="file" accept=".zip" disabled={busy} onChange={(e) => e.target.files?.[0] && void importZip(e.target.files[0])} /></label></div></section>}
          </>
        )}

        {view === "create" && (
          <section className="admin-section">
            <div className="admin-section-heading"><div><Plus /><div><h2>{editingId ? "Editar personagem e rotação" : "Novo personagem e rotação"}</h2><p>{editingId ? "Atualize qualquer informação do cadastro." : isOwner ? "Será publicado imediatamente." : "Será enviado como rascunho."}</p></div></div>{editingId && <button className="secondary-button" type="button" onClick={resetForm}><X size={15} /> Cancelar edição</button>}</div>
            <form className="character-form" onSubmit={saveCharacter}>
              <label>Nome<input value={form.name} onChange={(e) => update("name", e.target.value)} required /></label>
              <label>Slug<input value={form.slug} onChange={(e) => update("slug", e.target.value)} required /></label>
              <label>Categoria<select value={form.category} onChange={(e) => update("category", e.target.value)}><option value="combat">Combate</option><option value="blast">Energia</option><option value="speed">Velocidade</option><option value="universal">Universal</option></select></label>
              <label>Status<select value={form.meta} onChange={(e) => update("meta", e.target.value)}><option value="normal">Normal</option><option value="good">Bom</option><option value="meta">Meta</option><option value="outdated">Defasado</option></select></label>
              <label>Função PvE<input value={form.role} onChange={(e) => update("role", e.target.value)} /></label>
              <label>Uniforme recomendado<input value={form.uniform} onChange={(e) => update("uniform", e.target.value)} /></label>
              <label className="span-2">Retrato<button className="asset-select-button" type="button" onClick={() => setPicker("portrait")}>{form.image_url ? <img src={form.image_url} alt="" /> : <ImagePlus size={22} />}<span><strong>{portraits.find((portrait) => portrait.id === form.portrait_id)?.file_name ?? "Adicionar retrato"}</strong><small>Abra a biblioteca visual para escolher ou colar uma imagem</small></span></button></label>
              <label>Rotação principal<input value={form.rotation} onChange={(e) => update("rotation", e.target.value)} required placeholder="6dc5c1c2c3c4" /></label>
              <label>Melhor CTP<button className="asset-select-button compact-asset" type="button" onClick={() => setPicker("ctp")}>{selectedCtp?.image_url ? <img src={selectedCtp.image_url} alt="" /> : <ImagePlus size={22} />}<span><strong>{selectedCtp?.name ?? "Escolher CTP criado"}</strong><small>Selecione um item da biblioteca de CTPs</small></span></button></label>
              <label className="span-2">Link do vídeo no YouTube<input type="url" value={form.youtube} onChange={(e) => update("youtube", e.target.value)} placeholder="https://youtube.com/watch?v=..." /></label>
              <button className="primary-button span-2" type="submit" disabled={busy}><ShieldCheck size={18} /> {editingId ? "Salvar alterações" : isOwner ? "Cadastrar e publicar" : "Enviar para aprovação"}</button>
            </form>
          </section>
        )}

        {view === "characters" && <section className="admin-section"><div className="admin-section-heading"><div><Users /><div><h2>Personagens cadastrados</h2><p>Edite informações, retrato, rotação e CTP ou exclua o cadastro.</p></div></div></div><div className="management-grid">{characters.map((character) => <article className="management-card" key={character.id}>{character.image_url ? <img src={character.image_url} alt="" /> : <span>{character.name.slice(0, 2)}</span>}<div><strong>{character.name}</strong><small>{character.ctp_recommendations?.[0]?.best_ctp ?? "Sem CTP"} · {character.rotations?.[0]?.rotation_text ?? "Sem rotação"}</small></div><div className="management-actions"><button type="button" onClick={() => editCharacter(character)}><Pencil size={14} /> Editar</button><button className="danger" type="button" onClick={() => void deleteCharacter(character)}><Trash2 size={14} /> Excluir</button></div></article>)}</div></section>}

        {view === "ctps" && <section className="admin-section"><div className="admin-section-heading"><div><Zap /><div><h2>Biblioteca de CTPs</h2><p>Somente os CTPs criados aqui aparecem ao cadastrar personagens.</p></div></div><button className="secondary-button" type="button" onClick={() => setPicker("ctp")}><ImagePlus size={15} /> Adicionar ou atualizar ícone</button></div><div className="management-grid ctp-management">{ctps.map((ctp) => <article className="management-card" key={ctp.id}>{ctp.image_url ? <img src={ctp.image_url} alt="" /> : <span>{ctp.name.slice(0, 2)}</span>}<div><strong>{ctp.name}</strong><small>{ctp.slug}</small></div><div className="management-actions"><button type="button" onClick={() => void renameCtp(ctp)}><Pencil size={14} /> Renomear</button><button className="danger" type="button" onClick={() => void deleteCtp(ctp)}><Trash2 size={14} /> Excluir</button></div></article>)}</div></section>}

        {view === "requests" && <section className="admin-section"><div className="admin-section-heading"><div><ShieldCheck /><div><h2>Solicitações de colaboradores</h2><p>{requests.length} pendentes</p></div></div></div><div className="request-list">{requests.length === 0 && <p className="empty-admin">Nenhuma solicitação pendente.</p>}{requests.map((request) => <article key={request.id}><div><strong>{request.profiles?.display_name ?? "Usuário"}</strong><p>{request.message || "Sem mensagem."}</p></div><div><button onClick={() => void review(request.id, "approved")}><Check /> Aprovar</button><button onClick={() => void review(request.id, "rejected")}><X /> Rejeitar</button></div></article>)}</div></section>}
      </div>

      {picker === "portrait" && <VisualAssetPicker title="Escolher retrato" items={portraits.map((portrait) => ({ id: portrait.id, label: portrait.file_name, imageUrl: portrait.public_url }))} selectedId={form.portrait_id} canUpload={isOwner} uploadLabel="Nome do personagem ou traje" onClose={() => setPicker(null)} onPasteImage={uploadPortrait} onSelect={(item) => setForm((current) => ({ ...current, portrait_id: item.id, image_url: item.imageUrl ?? "" }))} />}
      {picker === "ctp" && <VisualAssetPicker title="Biblioteca de CTPs" items={ctps.map((ctp) => ({ id: ctp.id, label: ctp.name, imageUrl: ctp.image_url }))} selectedId={form.ctp_id} canUpload={isOwner} uploadLabel="Nome do novo CTP" onClose={() => setPicker(null)} onPasteImage={uploadCtp} onSelect={(item) => setForm((current) => ({ ...current, ctp_id: item.id }))} />}
    </main>
  );
}
