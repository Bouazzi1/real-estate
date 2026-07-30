"use client";

import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Upload,
  Search,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Building,
  Eye,
  Video
} from "lucide-react";
import { formatPrice } from "@/lib/formatters";

interface Project {
  id: string;
  name: string;
}

interface Apartment {
  id: string;
  projectId: string;
  reference: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  floor: number;
  orientation: string;
  balcony: boolean;
  parking: boolean;
  status: string;
  featured: boolean;
  gallery: string[];
  floorPlanUrl: string | null;
  virtualTourUrl: string | null;
  videoUrl?: string | null;
  views?: number;
  project: Project;
}

interface ApartmentsClientProps {
  initialApartments: Apartment[];
  projects: Project[];
}

export default function ApartmentsClient({ initialApartments, projects }: ApartmentsClientProps) {
  const [apartments, setApartments] = useState<Apartment[]>(initialApartments);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingApt, setEditingApt] = useState<Apartment | null>(null);

  // Form states
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [reference, setReference] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [surface, setSurface] = useState("");
  const [rooms, setRooms] = useState("3");
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("2");
  const [floor, setFloor] = useState("1");
  const [orientation, setOrientation] = useState("South");
  const [balcony, setBalcony] = useState(false);
  const [parking, setParking] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState("AVAILABLE");
  const [description, setDescription] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [floorPlanUrl, setFloorPlanUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  // Upload states
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [error, setError] = useState("");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingApt) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  const handleOpenAdd = () => {
    setEditingApt(null);
    setProjectId(projects[0]?.id || "");
    setReference("");
    setTitle("");
    setSlug("");
    setPrice("");
    setSurface("");
    setRooms("3");
    setBedrooms("2");
    setBathrooms("2");
    setFloor("1");
    setOrientation("South");
    setBalcony(false);
    setParking(false);
    setFeatured(false);
    setStatus("AVAILABLE");
    setDescription("");
    setGallery([]);
    setFloorPlanUrl(null);
    setVideoUrl(null);
    setError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (apt: Apartment) => {
    setEditingApt(apt);
    setProjectId(apt.projectId);
    setReference(apt.reference);
    setTitle(apt.title);
    setSlug(apt.slug);
    setPrice(apt.price.toString());
    setSurface(apt.surface.toString());
    setRooms(apt.rooms.toString());
    setBedrooms(apt.bedrooms.toString());
    setBathrooms(apt.bathrooms.toString());
    setFloor(apt.floor.toString());
    setOrientation(apt.orientation);
    setBalcony(apt.balcony);
    setParking(apt.parking);
    setFeatured(apt.featured);
    setStatus(apt.status);
    setDescription(apt.description);
    setGallery(apt.gallery);
    setFloorPlanUrl(apt.floorPlanUrl);
    setVideoUrl(apt.videoUrl || null);
    setError("");
    setIsFormOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "gallery" | "floorplan" | "video") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec du téléversement de l'image");

      if (type === "gallery") {
        setGallery((prev) => [...prev, data.url]);
      } else if (type === "video") {
        setVideoUrl(data.url);
      } else {
        setFloorPlanUrl(data.url);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du téléversement de l'image");
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const payload = {
      projectId,
      reference,
      title,
      slug,
      description,
      price: parseFloat(price),
      surface: parseFloat(surface),
      rooms: parseInt(rooms),
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      floor: parseInt(floor),
      orientation,
      balcony,
      parking,
      featured,
      status,
      gallery,
      floorPlanUrl,
      videoUrl,
    };

    try {
      const url = editingApt ? `/api/admin/apartments/${editingApt.id}` : "/api/admin/apartments";
      const method = editingApt ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save apartment");

      // Refresh list
      if (editingApt) {
        setApartments((prev) =>
          prev.map((apt) => (apt.id === editingApt.id ? { ...data, project: projects.find((p) => p.id === projectId)! } : apt))
        );
      } else {
        setApartments((prev) => [
          { ...data, project: projects.find((p) => p.id === projectId)! },
          ...prev,
        ]);
      }

      setIsFormOpen(false);
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this apartment listing?")) return;

    try {
      const res = await fetch(`/api/admin/apartments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setApartments((prev) => prev.filter((apt) => apt.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  const handleDuplicate = async (apt: Apartment) => {
    const newRef = `${apt.reference}-COPY`;
    const newSlug = `${apt.slug}-copy-${Date.now()}`;
    const newTitle = `${apt.title} (Copy)`;

    if (!confirm(`Duplicate apartment ${apt.reference} into ${newRef}?`)) return;

    try {
      const res = await fetch("/api/admin/apartments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...apt,
          reference: newRef,
          title: newTitle,
          slug: newSlug,
          status: "AVAILABLE",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate");

      setApartments((prev) => [
        { ...data, project: projects.find((p) => p.id === apt.projectId)! },
        ...prev,
      ]);
    } catch (err: any) {
      alert(err.message || "Failed to duplicate");
    }
  };

  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setSubmitting(true);
    setImportResults(null);
    setError("");

    const formData = new FormData();
    formData.append("file", csvFile);
    formData.append("projectId", projectId);

    try {
      const res = await fetch("/api/admin/apartments/bulk", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import CSV");

      setImportResults(data);
      // Trigger data reloading
      const freshRes = await fetch("/api/admin/apartments");
      const freshData = await freshRes.json();
      setApartments(freshData);
    } catch (err: any) {
      setError(err.message || "Failed to parse and import CSV file");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApartments = apartments.filter((apt) => {
    const matchesSearch =
      apt.reference.toLowerCase().includes(search.toLowerCase()) ||
      apt.title.toLowerCase().includes(search.toLowerCase());
    const matchesProject = projectFilter === "all" || apt.projectId === projectFilter;
    return matchesSearch && matchesProject;
  });

  return (
    <div className="space-y-6">
      {/* Title Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Catalogue des Appartements</h2>
          <p className="text-slate-400 text-xs mt-1">Gérez la liste des logements disponibles, modifiez leurs tarifs ou importez un fichier CSV</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setProjectId(projects[0]?.id || "");
              setCsvFile(null);
              setImportResults(null);
              setError("");
              setIsImportOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Import CSV en Masse</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Appartement</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-xl">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Rechercher par référence ou désignation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-transparent border-none text-slate-300 focus:outline-none text-xs cursor-pointer py-1"
            >
              <option value="all">Tous les Projets</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Datatable Listings */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-950/20">
                <th className="py-4 px-6">Référence</th>
                <th className="py-4 px-6">Désignation</th>
                <th className="py-4 px-6">Projet</th>
                <th className="py-4 px-6">Prix</th>
                <th className="py-4 px-6">Superficie</th>
                <th className="py-4 px-6">Caractéristiques</th>
                <th className="py-4 px-6">Visites</th>
                <th className="py-4 px-6">Statut</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredApartments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                    Aucun appartement trouvé pour cette recherche.
                  </td>
                </tr>
              ) : (
                filteredApartments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="py-4 px-6 font-mono font-bold text-amber-400">{apt.reference}</td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-semibold text-white">{apt.title}</div>
                        {apt.featured && (
                          <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold">
                            EN VEDETTE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">{apt.project.name}</td>
                    <td className="py-4 px-6 font-semibold text-white">
                      {formatPrice(apt.price)} DT
                    </td>
                    <td className="py-4 px-6 text-slate-400">{apt.surface} m²</td>
                    <td className="py-4 px-6 text-slate-400">
                      {apt.rooms} pièces · {apt.bedrooms} ch. · {apt.bathrooms} sdb
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono font-semibold">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px]">
                        <Eye className="w-3 h-3 shrink-0" />
                        <span>{apt.views || 0}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        apt.status === "AVAILABLE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        apt.status === "RESERVED" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {apt.status === "AVAILABLE" ? "DISPONIBLE" : apt.status === "RESERVED" ? "RÉSERVÉ" : apt.status === "SOLD" ? "VENDU" : apt.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleDuplicate(apt)}
                        title="Duplicate"
                        className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all cursor-pointer inline-flex"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(apt)}
                        title="Edit"
                        className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer inline-flex"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(apt.id)}
                        title="Delete"
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer inline-flex"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingApt ? `Modifier l'Appartement : ${editingApt.reference}` : "Ajouter un Nouvel Appartement"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-500 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Projet / Résidence
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Code de Référence
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: WAF-101"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Titre
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Appartement S+2 de Luxe"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Identifiant URL (Slug)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: appartement-s2-luxe-waf101"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Prix (DT)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="ex: 450000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Surface (m²)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="ex: 88.5"
                    value={surface}
                    onChange={(e) => setSurface(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-4 gap-3 md:col-span-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Pièces
                    </label>
                    <input
                      type="number"
                      required
                      value={rooms}
                      onChange={(e) => setRooms(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white text-center focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Chambres
                    </label>
                    <input
                      type="number"
                      required
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white text-center focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Salles de Bain
                    </label>
                    <input
                      type="number"
                      required
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white text-center focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Étage
                    </label>
                    <input
                      type="number"
                      required
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white text-center focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Orientation
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Sud-Ouest"
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Statut
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="AVAILABLE">DISPONIBLE</option>
                    <option value="RESERVED">RÉSERVÉ</option>
                    <option value="SOLD">VENDU</option>
                  </select>
                </div>

                {/* Checkbox triggers */}
                <div className="flex flex-wrap gap-6 md:col-span-2 pt-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={balcony}
                      onChange={(e) => setBalcony(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-blue-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                    />
                    <span>Balcon inclus</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parking}
                      onChange={(e) => setParking(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-blue-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                    />
                    <span>Parking privé inclus</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-blue-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                    />
                    <span className="text-amber-400 font-bold">Mettre en Vedette</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Description détaillée de l'appartement, finitions, matériaux, vue et commodités..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Upload Section: Floor Plan */}
                <div className="md:col-span-2 border-t border-slate-800/60 pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Plan de l'Appartement (2D/3D)</h4>
                      <p className="text-slate-500 text-[10px] mt-0.5">Téléverser un plan d'architecte ou une image de haute qualité</p>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "floorplan")}
                        className="hidden"
                        id="floorplan-upload"
                      />
                      <label
                        htmlFor="floorplan-upload"
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        ) : (
                          <Upload className="w-4 h-4 text-blue-500" />
                        )}
                        <span>Téléverser le Plan</span>
                      </label>
                    </div>
                  </div>
                  {floorPlanUrl && (
                    <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate pr-4">
                        <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-xs text-slate-300 truncate font-mono">{floorPlanUrl}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFloorPlanUrl(null)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload Section: Video Presentation */}
                <div className="md:col-span-2 border-t border-slate-800/60 pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Video className="w-4 h-4 text-rose-400" />
                        <span>Vidéo de Présentation (MP4 ou URL)</span>
                      </h4>
                      <p className="text-slate-500 text-[10px] mt-0.5">Téléverser une vidéo MP4 ou coller un lien YouTube / Visite 3D</p>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileUpload(e, "video")}
                        className="hidden"
                        id="video-upload"
                      />
                      <label
                        htmlFor="video-upload"
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                        ) : (
                          <Upload className="w-4 h-4 text-rose-400" />
                        )}
                        <span>Téléverser Vidéo MP4</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Ou lien vidéo YouTube / Vimeo / Visite Virtuelle (https://...)"
                      value={videoUrl || ""}
                      onChange={(e) => setVideoUrl(e.target.value || null)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  {videoUrl && (
                    <div className="mt-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate pr-4">
                        <Video className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="text-xs text-slate-300 truncate font-mono">{videoUrl}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVideoUrl(null)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload Section: Gallery Images */}
                <div className="md:col-span-2 border-t border-slate-800/60 pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Galerie de Photos</h4>
                      <p className="text-slate-500 text-[10px] mt-0.5">Ajouter des photos montrant les finitions intérieures et extérieures</p>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "gallery")}
                        className="hidden"
                        id="gallery-upload"
                      />
                      <label
                        htmlFor="gallery-upload"
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        ) : (
                          <Plus className="w-4 h-4 text-blue-500" />
                        )}
                        <span>Ajouter une Photo</span>
                      </label>
                    </div>
                  </div>

                  {gallery.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                      {gallery.map((url, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 aspect-video">
                          <img src={url} alt={`gallery-${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setGallery((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : editingApt ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  <span>{editingApt ? "Enregistrer les Modifications" : "Créer l'Appartement"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Importation Massive CSV</h3>
              <button
                onClick={() => setIsImportOpen(false)}
                className="p-1 text-slate-500 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleImportCSV} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Projet Cible
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Sélectionner le Fichier CSV
                </label>
                <input
                  type="file"
                  required
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-500/10 file:text-blue-400 file:cursor-pointer"
                />
              </div>

              {/* Sample format helper */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-[10px] text-slate-400 space-y-2 leading-relaxed">
                <p className="font-semibold text-slate-300">Format des Entêtes CSV Requis :</p>
                <code className="block bg-slate-950 p-2 rounded border border-slate-850 font-mono text-[9px] truncate">
                  reference,title,slug,price,surface,rooms,bedrooms,bathrooms,floor,orientation,balcony,parking,featured,description,gallery,floorplanurl
                </code>
                <p>Note : Séparez les URL des galeries par un point-virgule (`;`). Les valeurs booléennes doivent être `true` ou `false` (ou `1` / `0`).</p>
              </div>

              {/* Results display */}
              {importResults && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400">Rapport d'Importation :</h4>
                  <p className="text-[11px] text-slate-300">
                    Importés avec succès : <span className="font-bold text-white">{importResults.importedCount}</span> appartements.
                    Ignorés / Échecs : <span className="font-bold text-white">{importResults.skippedCount}</span> lignes.
                  </p>
                  {importResults.errors?.length > 0 && (
                    <div className="max-h-24 overflow-y-auto text-[9px] text-red-400/90 font-mono space-y-1 mt-2 bg-slate-950 p-2 rounded border border-slate-850">
                      {importResults.errors.map((err: string, i: number) => (
                        <p key={i}>{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-6">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !csvFile}
                  className="flex items-center justify-center px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  <span>Importer les Données CSV</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
