import { ArrowUpRight, RotateCcw } from "lucide-react";
import type { CharacterCatalog } from "../lib/types";

const categoryLabels = {
  universal: "Universal",
  combat: "Combate",
  speed: "Velocidade",
  blast: "Energia",
} as const;

const statusLabels = {
  meta: "Meta",
  good: "Bom",
  normal: "Normal",
  outdated: "Defasado",
} as const;

interface CharacterCardProps {
  character: CharacterCatalog;
  onOpen: (character: CharacterCatalog) => void;
}

export function CharacterCard({ character, onOpen }: CharacterCardProps) {
  return (
    <article className="character-card">
      <div className={`character-art category-${character.category}`}>
        {character.image_url ? (
          <img src={character.image_url} alt={character.name} loading="lazy" />
        ) : (
          <span>{character.name.slice(0, 2).toUpperCase()}</span>
        )}
        <span className={`meta-badge meta-${character.meta_status}`}>{statusLabels[character.meta_status]}</span>
      </div>

      <div className="character-body">
        <div>
          <p className="eyebrow">{categoryLabels[character.category]} · {character.pve_role ?? "PvE"}</p>
          <h3>{character.name}</h3>
        </div>
        <div className="quick-stats">
          <span><strong>CTP</strong><span className="ctp-inline">{character.ctp_image_url && <img src={character.ctp_image_url} alt="" />}{character.best_ctp ?? "Em revisão"}</span></span>
          {character.secondary_ctp_name && <span><strong>CTP 2</strong><span className="ctp-inline">{character.secondary_ctp_image_url && <img src={character.secondary_ctp_image_url} alt="" />}{character.secondary_ctp_name}</span></span>}
          <span><strong>Rotação</strong><code>{character.primary_rotation ?? "Em revisão"}</code></span>
        </div>
        <button className="card-button" type="button" onClick={() => onOpen(character)}>
          <RotateCcw size={16} /> Ver rotação <ArrowUpRight size={16} />
        </button>
      </div>
    </article>
  );
}
