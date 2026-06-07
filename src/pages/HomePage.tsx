import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { CharacterCard } from "../components/CharacterCard";
import { CharacterModal } from "../components/CharacterModal";
import { supabase } from "../lib/supabase";
import type { Category, CharacterCatalog } from "../lib/types";

const categories: Array<{ value: Category; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "universal", label: "Universal" },
  { value: "combat", label: "Combate" },
  { value: "speed", label: "Velocidade" },
  { value: "blast", label: "Energia" },
];

export function HomePage() {
  const [characters, setCharacters] = useState<CharacterCatalog[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [selected, setSelected] = useState<CharacterCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadCharacters() {
      setLoading(true);
      const { data, error: catalogError } = await supabase
        .from("character_catalog")
        .select("*")
        .order("name");
      if (!active) return;
      if (catalogError) setError("Não foi possível carregar os personagens.");
      else setCharacters((data ?? []) as CharacterCatalog[]);
      setLoading(false);
    }
    void loadCharacters();
    return () => { active = false; };
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const filteredCharacters = characters.filter((character) => {
    const matchesCategory = category === "all" || character.category === category;
    const matchesQuery = !normalizedQuery || [character.name, character.slug, ...character.aliases]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
    return matchesCategory && matchesQuery;
  });

  return (
    <main>
      <section className="hero">
        <label className="search-box">
          <Search size={21} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquise um personagem... Ex: Venom" />
        </label>

        <div className="category-filter" aria-label="Filtrar por categoria">
          {categories.map((item) => (
            <button
              className={category === item.value ? "active" : ""}
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="catalog-section">
        <div className="section-heading">
          <div><h2>Personagens PVE</h2></div>
        </div>
        {loading && <div className="status-message">Carregando heróis...</div>}
        {error && <div className="status-message error">{error}</div>}
        {!loading && !error && filteredCharacters.length === 0 && (
          <div className="status-message">Nenhum personagem encontrado. Tente outro nome ou categoria.</div>
        )}
        <div className="character-grid">
          {filteredCharacters.map((character) => (
            <CharacterCard key={character.id} character={character} onOpen={setSelected} />
          ))}
        </div>
      </section>

      {selected && <CharacterModal character={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
