"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Edit3,
  Eye,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Building2,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";

interface CmsSection {
  id: string;
  key: string;
  order: number;
  enabled: boolean;
  content: any;
  draft: any | null;
}

interface CmsClientProps {
  initialSections: CmsSection[];
}

export default function CmsClient({ initialSections }: CmsClientProps) {
  const [sections, setSections] = useState<CmsSection[]>(initialSections);
  const [activeSectionId, setActiveSectionId] = useState<string>(initialSections[0]?.id || "");
  
  // Loading & Submission states
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeSection = sections.find((s) => s.id === activeSectionId);
  const [draftContent, setDraftContent] = useState<any>({});

  useEffect(() => {
    if (activeSection) {
      setDraftContent(activeSection.draft || activeSection.content);
    }
  }, [activeSectionId, sections]);

  const reloadPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = `${window.location.origin}/?preview=true&t=${Date.now()}`;
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setDraftContent((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeSectionId,
          draft: draftContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'enregistrer le brouillon");

      setSections((prev) =>
        prev.map((s) => (s.id === activeSectionId ? data : s))
      );
      setSuccess("Modifications enregistrées dans le brouillon !");
      reloadPreview();
    } catch (err: any) {
      setError(err.message || "Impossible d'enregistrer le brouillon");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (action: "publish" | "discard") => {
    const confirmation = action === "publish" 
      ? "Êtes-vous sûr de vouloir publier ces modifications sur le site public ?" 
      : "Êtes-vous sûr de vouloir annuler tous les brouillons en attente ?";
    if (!window.confirm(confirmation)) return;

    setPublishing(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/cms/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'action");

      setSections(data.sections);
      setSuccess(action === "publish" ? "Le site a été mis à jour avec succès !" : "Tous les brouillons ont été réinitialisés.");
      reloadPreview();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setPublishing(false);
    }
  };

  const moveSection = async (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    // Swap elements
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    setSections(newSections);

    try {
      const res = await fetch("/api/admin/cms/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionIds: newSections.map((s) => s.id),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Échec de la réorganisation");
      }
      reloadPreview();
    } catch (err: any) {
      alert(err.message || "Impossible de réorganiser les sections");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Éditeur CMS Vitrine</h2>
          <p className="text-slate-300 text-xs font-medium mt-1">Personnalisez le contenu de la page d'accueil et prévisualisez vos modifications en direct</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handlePublish("discard")}
            disabled={publishing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <XCircle className="w-4 h-4 text-red-500" />
            <span>Annuler les Brouillons</span>
          </button>
          <button
            onClick={() => handlePublish("publish")}
            disabled={publishing}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-amber-500/15 cursor-pointer disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>Publier sur le Site</span>
          </button>
        </div>
      </div>

      {/* Main split-screen panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Layout tree and editor (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section tree & sorting */}
          <div className="border border-slate-700/80 rounded-3xl p-6 bg-slate-900/90 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Ordre des Sections</h3>
            <div className="space-y-2">
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    activeSectionId === section.id
                      ? "bg-amber-500 border-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/10"
                      : "bg-slate-950 border-slate-700 text-slate-200 font-bold hover:text-white hover:border-amber-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-xs ${activeSectionId === section.id ? "text-slate-900 font-extrabold" : "text-slate-400"}`}>#{idx + 1}</span>
                    <span>{section.key}</span>
                    {section.draft && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${activeSectionId === section.id ? "bg-slate-950 text-amber-400 border border-slate-900" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"}`}>
                        BROUILLON
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(idx, "up");
                      }}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(idx, "down");
                      }}
                      disabled={idx === sections.length - 1}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section content Editor */}
          {activeSection && (
            <div className="border border-slate-700/80 rounded-3xl p-6 bg-slate-900/90 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Éditer la section {activeSection.key}</h3>
                </div>
                <button
                  onClick={saveDraft}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 text-amber-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Sauvegarder</span>
                </button>
              </div>

              {success && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{success}</span>
                </div>
              )}
              {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 font-semibold rounded-xl text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form elements mapped to CMS structure */}
              <form onSubmit={saveDraft} className="space-y-5 text-xs">
                {activeSection.key === "HERO" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Titre Principal (Headline)</label>
                      <input
                        type="text"
                        required
                        value={draftContent.headline || ""}
                        onChange={(e) => handleFieldChange("headline", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Sous-titre / Slogan</label>
                      <textarea
                        rows={3}
                        required
                        value={draftContent.subheadline || ""}
                        onChange={(e) => handleFieldChange("subheadline", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">URL de l'image d'arrière-plan</label>
                      <input
                        type="text"
                        required
                        value={draftContent.backgroundUrl || ""}
                        onChange={(e) => handleFieldChange("backgroundUrl", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Opacité du voile d'arrière-plan ({draftContent.overlayOpacity || 0.6})</label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.1"
                        value={draftContent.overlayOpacity || 0.6}
                        onChange={(e) => handleFieldChange("overlayOpacity", parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500 border border-slate-700"
                      />
                    </div>
                  </>
                )}

                {activeSection.key === "ABOUT" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Titre de la Section</label>
                      <input
                        type="text"
                        required
                        value={draftContent.title || ""}
                        onChange={(e) => handleFieldChange("title", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Description Principale</label>
                      <textarea
                        rows={6}
                        required
                        value={draftContent.description || ""}
                        onChange={(e) => handleFieldChange("description", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">URL de l'image de présentation</label>
                      <input
                        type="text"
                        required
                        value={draftContent.imageUrl || ""}
                        onChange={(e) => handleFieldChange("imageUrl", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </>
                )}

                {activeSection.key === "CTA" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Titre d'Appel à l'Action (CTA)</label>
                      <input
                        type="text"
                        required
                        value={draftContent.title || ""}
                        onChange={(e) => handleFieldChange("title", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Description CTA</label>
                      <textarea
                        rows={3}
                        required
                        value={draftContent.description || ""}
                        onChange={(e) => handleFieldChange("description", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Texte du Bouton</label>
                        <input
                          type="text"
                          required
                          value={draftContent.buttonText || ""}
                          onChange={(e) => handleFieldChange("buttonText", e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Lien du Bouton</label>
                        <input
                          type="text"
                          required
                          value={draftContent.buttonLink || ""}
                          onChange={(e) => handleFieldChange("buttonLink", e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSection.key === "FEATURED" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Titre du Bloc Biens en Vedette</label>
                      <input
                        type="text"
                        required
                        value={draftContent.title || ""}
                        onChange={(e) => handleFieldChange("title", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Sous-titre du Bloc</label>
                      <input
                        type="text"
                        required
                        value={draftContent.subtitle || ""}
                        onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Nombre de biens affichés ({draftContent.limit || 3})</label>
                      <input
                        type="number"
                        min="3"
                        max="12"
                        required
                        value={draftContent.limit || 3}
                        onChange={(e) => handleFieldChange("limit", parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-bold text-center focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </>
                )}

                {activeSection.key === "STATS" && (
                  <div className="space-y-4">
                    <span className="block font-bold text-xs text-slate-200 uppercase tracking-wider mb-2">Indicateurs Statistiques (Max 3)</span>
                    {draftContent.items?.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-950 border border-slate-700 rounded-2xl space-y-3 shadow-md">
                        <span className="text-xs font-extrabold text-amber-400">Statistique #{idx + 1}</span>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-300 mb-1">Valeur numérique</label>
                            <input
                              type="number"
                              step="0.1"
                              required
                              value={item.number}
                              onChange={(e) => {
                                const newItems = [...draftContent.items];
                                newItems[idx] = { ...item, number: parseFloat(e.target.value) };
                                handleFieldChange("items", newItems);
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">Suffixe (ex: +, %)</label>
                            <input
                              type="text"
                              value={item.suffix || ""}
                              onChange={(e) => {
                                const newItems = [...draftContent.items];
                                newItems[idx] = { ...item, suffix: e.target.value };
                                handleFieldChange("items", newItems);
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white text-center font-bold"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Libellé</label>
                          <input
                            type="text"
                            required
                            value={item.label}
                            onChange={(e) => {
                              const newItems = [...draftContent.items];
                              newItems[idx] = { ...item, label: e.target.value };
                              handleFieldChange("items", newItems);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white font-medium"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Right Side: IFrame Live preview (7 columns) */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-8">
          <div className="flex items-center justify-between bg-slate-950 border border-slate-700 px-6 py-3 rounded-t-3xl border-b-0 shadow-md">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Aperçu en Direct du Brouillon</span>
            </div>
            <button
              onClick={reloadPreview}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
            >
              Actualiser l'Aperçu
            </button>
          </div>
          <div className="border border-slate-700 rounded-b-3xl overflow-hidden aspect-[9/10] sm:aspect-video lg:aspect-[3/4] bg-slate-900 shadow-2xl relative">
            <iframe
              ref={iframeRef}
              src={`/?preview=true`}
              className="w-full h-full border-none bg-white"
              title="Aperçu CMS en Direct"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
