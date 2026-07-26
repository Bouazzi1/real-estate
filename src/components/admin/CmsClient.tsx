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
  // If active section has a draft, we edit the draft; otherwise we copy content as initial draft edit
  const [draftContent, setDraftContent] = useState<any>({});

  // Sync draftContent whenever activeSection changes
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
      if (!res.ok) throw new Error(data.error || "Failed to save draft");

      setSections((prev) =>
        prev.map((s) => (s.id === activeSectionId ? data : s))
      );
      setSuccess("Draft changes saved locally!");
      reloadPreview();
    } catch (err: any) {
      setError(err.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (action: "publish" | "discard") => {
    const confirmation = action === "publish" 
      ? "Publish all draft CMS modifications live to production?" 
      : "Discard all current draft changes and return live layout?";
    if (!confirm(confirmation)) return;

    setPublishing(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/cms/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to complete action");
      }

      // Refresh listings
      const freshRes = await fetch("/api/admin/cms");
      const freshData = await freshRes.json();
      setSections(freshData);
      setSuccess(action === "publish" ? "CMS changes published successfully!" : "Draft changes discarded.");
      reloadPreview();
    } catch (err: any) {
      setError(err.message || "Failed to publish/discard");
    } finally {
      setPublishing(false);
    }
  };

  const moveSection = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    
    // Swap
    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    // Apply client update
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
        throw new Error(data.error || "Failed to reorder");
      }
      reloadPreview();
    } catch (err: any) {
      alert(err.message || "Failed to save reordered sections");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Visual CMS Editor</h2>
          <p className="text-slate-400 text-xs mt-1">Configure layout sections and preview updates live before publishing</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handlePublish("discard")}
            disabled={publishing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-400 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-4 h-4 text-red-500" />
            <span>Discard Drafts</span>
          </button>
          <button
            onClick={() => handlePublish("publish")}
            disabled={publishing}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/10 cursor-pointer disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>Publish Changes</span>
          </button>
        </div>
      </div>

      {/* Main split-screen panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Layout tree and editor (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section tree & sorting */}
          <div className="glass border border-slate-800 rounded-3xl p-6 bg-slate-900/40 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Layout Ordering</h3>
            <div className="space-y-2">
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    activeSectionId === section.id
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/5"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-slate-500">#{idx + 1}</span>
                    <span>{section.key}</span>
                    {section.draft && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[8px] font-black border border-amber-500/20 uppercase tracking-wider">
                        DRAFT
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
                      className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(idx, "down");
                      }}
                      disabled={idx === sections.length - 1}
                      className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section content Editor */}
          {activeSection && (
            <div className="glass border border-slate-800 rounded-3xl p-6 bg-slate-900/40 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-white">Edit {activeSection.key} Content</h3>
                </div>
                <button
                  onClick={saveDraft}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:text-white text-blue-500 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Draft</span>
                </button>
              </div>

              {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
                  {success}
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                  {error}
                </div>
              )}

              {/* Form elements mapped to CMS structure */}
              <form onSubmit={saveDraft} className="space-y-5 text-xs">
                {activeSection.key === "HERO" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Headline</label>
                      <input
                        type="text"
                        required
                        value={draftContent.headline || ""}
                        onChange={(e) => handleFieldChange("headline", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Subheadline</label>
                      <textarea
                        rows={3}
                        required
                        value={draftContent.subheadline || ""}
                        onChange={(e) => handleFieldChange("subheadline", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Background Image URL</label>
                      <input
                        type="text"
                        required
                        value={draftContent.backgroundUrl || ""}
                        onChange={(e) => handleFieldChange("backgroundUrl", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Overlay Opacity ({draftContent.overlayOpacity || 0.6})</label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.1"
                        value={draftContent.overlayOpacity || 0.6}
                        onChange={(e) => handleFieldChange("overlayOpacity", parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </>
                )}

                {activeSection.key === "ABOUT" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Title</label>
                      <input
                        type="text"
                        required
                        value={draftContent.title || ""}
                        onChange={(e) => handleFieldChange("title", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Description</label>
                      <textarea
                        rows={6}
                        required
                        value={draftContent.description || ""}
                        onChange={(e) => handleFieldChange("description", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Image URL</label>
                      <input
                        type="text"
                        required
                        value={draftContent.imageUrl || ""}
                        onChange={(e) => handleFieldChange("imageUrl", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {activeSection.key === "CTA" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">CTA Headline</label>
                      <input
                        type="text"
                        required
                        value={draftContent.title || ""}
                        onChange={(e) => handleFieldChange("title", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">CTA Description</label>
                      <textarea
                        rows={3}
                        required
                        value={draftContent.description || ""}
                        onChange={(e) => handleFieldChange("description", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Button Text</label>
                        <input
                          type="text"
                          required
                          value={draftContent.buttonText || ""}
                          onChange={(e) => handleFieldChange("buttonText", e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Button Link</label>
                        <input
                          type="text"
                          required
                          value={draftContent.buttonLink || ""}
                          onChange={(e) => handleFieldChange("buttonLink", e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeSection.key === "FEATURED" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Section Header Title</label>
                      <input
                        type="text"
                        required
                        value={draftContent.title || ""}
                        onChange={(e) => handleFieldChange("title", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Section Subtitle</label>
                      <input
                        type="text"
                        required
                        value={draftContent.subtitle || ""}
                        onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Listing count limit ({draftContent.limit || 3})</label>
                      <input
                        type="number"
                        min="3"
                        max="12"
                        required
                        value={draftContent.limit || 3}
                        onChange={(e) => handleFieldChange("limit", parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white text-center focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {activeSection.key === "STATS" && (
                  <div className="space-y-4">
                    <span className="block font-bold text-slate-400 mb-2">Stat Indicators (Limit 3)</span>
                    {draftContent.items?.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-3">
                        <span className="text-[10px] font-bold text-slate-500">Stat #{idx + 1}</span>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="block text-[9px] text-slate-400 mb-1">Value (number)</label>
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
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-400 mb-1">Suffix (e.g. +, %)</label>
                            <input
                              type="text"
                              value={item.suffix || ""}
                              onChange={(e) => {
                                const newItems = [...draftContent.items];
                                newItems[idx] = { ...item, suffix: e.target.value };
                                handleFieldChange("items", newItems);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-white text-center"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-400 mb-1">Label</label>
                          <input
                            type="text"
                            required
                            value={item.label}
                            onChange={(e) => {
                              const newItems = [...draftContent.items];
                              newItems[idx] = { ...item, label: e.target.value };
                              handleFieldChange("items", newItems);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-white"
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
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800/80 px-6 py-3 rounded-t-3xl border-b-0">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-white">Live Draft Preview</span>
            </div>
            <button
              onClick={reloadPreview}
              className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold cursor-pointer"
            >
              Force Reload
            </button>
          </div>
          <div className="border border-slate-800 rounded-b-3xl overflow-hidden aspect-[9/10] sm:aspect-video lg:aspect-[3/4] bg-slate-900 shadow-2xl relative">
            <iframe
              ref={iframeRef}
              src={`/?preview=true`}
              className="w-full h-full border-none bg-white"
              title="CMS Live Preview"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
