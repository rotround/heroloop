import { Check, Clipboard, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { CharacterCatalog } from "../lib/types";

interface CharacterModalProps {
  character: CharacterCatalog;
  onClose: () => void;
}

export function CharacterModal({ character, onClose }: CharacterModalProps) {
  const [copied, setCopied] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function copyRotation() {
    if (!character.primary_rotation) return;
    try {
      await navigator.clipboard.writeText(character.primary_rotation);
    } catch {
      const input = document.createElement("textarea");
      input.value = character.primary_rotation;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="close-button" type="button" onClick={onClose} aria-label="Fechar detalhes">
          <X size={20} />
        </button>
        <div className="detail-heading">
          <div className="detail-portrait">
            {character.image_url ? <img src={character.image_url} alt={character.name} /> : <span>{character.name.slice(0, 2)}</span>}
          </div>
          <div>
            <p className="eyebrow">{character.category} · atualizado em {new Date(character.updated_at).toLocaleDateString("pt-BR")}</p>
            <h2 id="character-title">{character.name}</h2>
          </div>
        </div>
        {character.is_demo && <p className="demo-alert">Conteúdo demonstrativo. Revise antes de usar como referência definitiva.</p>}

        <div className="detail-grid">
          <div className="detail-panel featured">
            <span className="panel-label">Rotação principal PvE</span>
            <code className="rotation-code">{character.primary_rotation ?? "Em revisão"}</code>
            <button className="primary-button" type="button" onClick={copyRotation} disabled={!character.primary_rotation}>
              {copied ? <Check size={18} /> : <Clipboard size={18} />}
              {copied ? "Rotação copiada!" : "Copiar rotação"}
            </button>
          </div>
          <div className="detail-panel">
            <span className="panel-label">Build recomendada</span>
            <div className="ctp-build">
              {character.ctp_image_url && <img src={character.ctp_image_url} alt={`CTP ${character.best_ctp ?? ""}`} />}
              <div><span className="panel-label">CTP</span><h3>{character.best_ctp ?? "Em revisão"}</h3></div>
            </div>
            {character.secondary_ctp_name && <div className="ctp-build">{character.secondary_ctp_image_url && <img src={character.secondary_ctp_image_url} alt={`CTP ${character.secondary_ctp_name}`} />}<div><span className="panel-label">CTP 2</span><h3>{character.secondary_ctp_name}</h3></div></div>}
            {character.alternative_ctps?.length ? <p>Alternativas: {character.alternative_ctps.join(", ")}</p> : null}
            <span className="panel-label">Uniforme</span>
            <p>{character.recommended_uniform ?? "Em revisão"}</p>
          </div>
        </div>

        {character.youtube_video_id && !showVideo && (
          <button className="video-link" type="button" onClick={() => setShowVideo(true)}>
            <Play size={18} fill="currentColor" /> Assistir prévia da rotação
          </button>
        )}
        {character.youtube_video_id && showVideo && (
          <div className="video-embed">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${character.youtube_video_id}?autoplay=1`}
              title={`Rotação de ${character.name}`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <div className="rotation-legend">
          <strong>Legenda rápida</strong>
          <span><code>c</code> cancelamento imediato</span>
          <span><code>dc</code> cancelamento após parte da animação</span>
          <span><code>proc</code> momento de encaixar o dano</span>
        </div>
      </section>
    </div>
  );
}
