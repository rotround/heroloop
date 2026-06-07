import { Check, ClipboardPaste, Search, X } from "lucide-react";
import { ClipboardEvent, useEffect, useMemo, useState } from "react";

export interface VisualAsset {
  id: string;
  label: string;
  imageUrl: string | null;
}

interface VisualAssetPickerProps {
  title: string;
  items: VisualAsset[];
  selectedId?: string;
  canUpload?: boolean;
  uploadLabel?: string;
  onClose: () => void;
  onSelect: (item: VisualAsset) => void;
  onPasteImage?: (name: string, image: File) => Promise<VisualAsset | void>;
}

export function VisualAssetPicker({
  title,
  items,
  selectedId,
  canUpload = false,
  uploadLabel = "Nome da nova imagem",
  onClose,
  onSelect,
  onPasteImage,
}: VisualAssetPickerProps) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const filtered = useMemo(() => {
    const normalized = (query.trim() || newName.trim()).toLocaleLowerCase("pt-BR");
    return normalized ? items.filter((item) => item.label.toLocaleLowerCase("pt-BR").includes(normalized)) : items;
  }, [items, newName, query]);

  async function pasteImage(event: ClipboardEvent<HTMLDivElement>) {
    if (!canUpload || !onPasteImage || uploading) return;
    const image = Array.from(event.clipboardData.files).find((file) => file.type.startsWith("image/"));
    if (!image) {
      setMessage("A área de transferência não contém uma imagem.");
      return;
    }
    if (!newName.trim()) {
      setMessage("Digite um nome antes de colar a imagem.");
      return;
    }
    event.preventDefault();
    setUploading(true);
    setMessage("Enviando imagem...");
    try {
      const item = await onPasteImage(newName.trim(), image);
      if (item) {
        onSelect(item);
        onClose();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="modal-backdrop asset-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="asset-picker" role="dialog" aria-modal="true" aria-labelledby="asset-picker-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose} aria-label="Fechar biblioteca"><X size={20} /></button>
        <div className="asset-picker-heading">
          <div><p className="eyebrow">Biblioteca visual</p><h2 id="asset-picker-title">{title}</h2></div>
          <span>{filtered.length} imagens</span>
        </div>
        <label className="asset-search"><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pelo nome..." /></label>
        {canUpload && (
          <div className="paste-upload">
            <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder={uploadLabel} />
            <div className="paste-zone" tabIndex={0} onPaste={pasteImage}>
              <ClipboardPaste size={22} />
              <div><strong>{uploading ? "Enviando..." : "Clique aqui e cole a imagem"}</strong><span>Use Ctrl+V depois de copiar o ícone.</span></div>
            </div>
            {message && <p>{message}</p>}
          </div>
        )}
        <div className="asset-grid">
          {filtered.map((item) => (
            <button className={selectedId === item.id ? "selected" : ""} key={item.id} type="button" onClick={() => { onSelect(item); onClose(); }}>
              <span className="asset-image">{item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : <b>{item.label.slice(0, 2)}</b>}{selectedId === item.id && <Check size={18} />}</span>
              <strong title={item.label}>{item.label}</strong>
            </button>
          ))}
          {filtered.length === 0 && <p className="empty-admin">Nenhuma imagem encontrada.</p>}
        </div>
      </section>
    </div>
  );
}
