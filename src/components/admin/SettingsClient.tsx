"use client";

import React, { useState } from "react";
import {
  Settings,
  Palette,
  Globe,
  Upload,
  Check,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Image as ImageIcon
} from "lucide-react";

interface SiteSettings {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  agencyName: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: any;
  seoTitle: string;
  seoDescription: string;
}

interface SettingsClientProps {
  initialSettings: SiteSettings | null;
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  // Form states
  const [agencyName, setAgencyName] = useState(initialSettings?.agencyName || "Résidence WAFA");
  const [contactEmail, setContactEmail] = useState(initialSettings?.contactEmail || "contact@groupelamiri.com");
  const [contactPhone, setContactPhone] = useState(initialSettings?.contactPhone || "+216 71 000 000");
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logoUrl || null);
  const [primaryColor, setPrimaryColor] = useState(initialSettings?.primaryColor || "#0f172a");
  const [secondaryColor, setSecondaryColor] = useState(initialSettings?.secondaryColor || "#f59e0b");
  const [fontFamily, setFontFamily] = useState(initialSettings?.fontFamily || "Inter");
  const [seoTitle, setSeoTitle] = useState(initialSettings?.seoTitle || "Résidence WAFA - Appartements de Luxe");
  const [seoDescription, setSeoDescription] = useState(initialSettings?.seoDescription || "Découvrez nos appartements haut de standing.");

  // Social Links
  const [facebook, setFacebook] = useState(initialSettings?.socialLinks?.facebook || "");
  const [instagram, setInstagram] = useState(initialSettings?.socialLinks?.instagram || "");
  const [linkedin, setLinkedin] = useState(initialSettings?.socialLinks?.linkedin || "");

  // Loaders
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fonts = ["Inter", "Outfit", "Roboto", "Montserrat", "Playfair Display", "Lora", "Poppins"];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", files[0]);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec du téléversement");

      setLogoUrl(data.url);
    } catch (err: any) {
      setError(err.message || "Échec du téléversement du logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    const payload = {
      logoUrl,
      primaryColor,
      secondaryColor,
      fontFamily,
      agencyName,
      contactEmail,
      contactPhone,
      socialLinks: { facebook, instagram, linkedin },
      seoTitle,
      seoDescription,
    };

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'enregistrement des paramètres");

      setSuccess("Paramètres enregistrés avec succès !");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Impossible d'enregistrer les paramètres");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Paramètres du Site</h2>
        <p className="text-slate-300 text-xs font-medium mt-1">Configurez les coordonnées de la résidence, les couleurs de la marque, la typographie et le référencement naturel (SEO)</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold rounded-2xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 font-semibold rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl text-xs">
        {/* Section 1: Agency Brand Details */}
        <div className="border border-slate-700/80 rounded-3xl p-6 bg-slate-900/90 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Settings className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Identité de la Résidence / Agence</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Nom de la Résidence / Agence
              </label>
              <input
                type="text"
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Téléphone de Contact
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Adresse E-mail de Contact
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Logo Image */}
            <div className="flex items-center justify-between gap-4 md:col-span-2 border-t border-slate-800 pt-6">
              <div>
                <h4 className="text-xs font-bold text-white">Logo Officiel</h4>
                <p className="text-slate-300 text-xs font-medium mt-0.5">Téléversez le visuel ou logo représentant la résidence</p>
              </div>
              <div className="flex items-center gap-4">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo Preview" className="w-12 h-12 rounded-xl object-contain bg-slate-950 border border-slate-700 p-1" />
                )}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload-input"
                  />
                  <label
                    htmlFor="logo-upload-input"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-700 hover:border-amber-500 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    {uploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Changer le Logo</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Visual Style Configuration */}
        <div className="border border-slate-700/80 rounded-3xl p-6 bg-slate-900/90 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Palette className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Personnalisation Visuelle</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary color picker */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Couleur Principale
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 border-0 bg-transparent cursor-pointer rounded-xl overflow-hidden shrink-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono font-bold uppercase focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Secondary color picker */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Couleur Secondaire
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 border-0 bg-transparent cursor-pointer rounded-xl overflow-hidden shrink-0"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono font-bold uppercase focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Font selector */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Police de Caractères
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-white font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {fonts.map((f) => (
                  <option key={f} value={f} className="bg-slate-900 text-white font-medium">
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: SEO Configuration */}
        <div className="border border-slate-700/80 rounded-3xl p-6 bg-slate-900/90 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Référencement Naturel (SEO)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Titre Méta par Défaut
              </label>
              <input
                type="text"
                required
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Description Méta par Défaut
              </label>
              <textarea
                rows={3}
                required
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Social Links */}
        <div className="border border-slate-700/80 rounded-3xl p-6 bg-slate-900/90 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <LinkIcon className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Réseaux Sociaux</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Lien Facebook
              </label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Lien Instagram
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Lien LinkedIn
              </label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white font-medium placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center py-3.5 px-8 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-lg cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            <span>Enregistrer les Paramètres</span>
          </button>
        </div>
      </form>
    </div>
  );
}
