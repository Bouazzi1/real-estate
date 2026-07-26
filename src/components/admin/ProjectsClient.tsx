"use client";

import React, { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Building,
  Edit2,
  Trash2,
  X,
  Loader2,
  ExternalLink,
  Layers
} from "lucide-react";

interface ApartmentSummary {
  id: string;
  title: string;
  reference: string;
  price: number;
  status: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  coverImage: string;
  gallery: string[];
  status: string;
  createdAt: string;
  apartments?: ApartmentSummary[];
}

interface ProjectsClientProps {
  initialProjects: Project[];
}

export default function ProjectsClient({ initialProjects }: ProjectsClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("48.8566");
  const [lng, setLng] = useState("2.3522");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setAddress("");
    setLat("48.8566");
    setLng("2.3522");
    setCoverImage("");
    setStatus("ACTIVE");
    setErrorMessage("");
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description,
        location: {
          address: address || "Paris, France",
          lat: parseFloat(lat) || 48.8566,
          lng: parseFloat(lng) || 2.3522,
        },
        coverImage: coverImage || "/uploads/aurea-exterior.png",
        gallery: [coverImage || "/uploads/aurea-exterior.png"],
        status,
      };

      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create project");
      }

      const created = await res.json();
      setProjects([created, ...projects]);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location?.address || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Real Estate Projects</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your architectural developments, luxury towers, and residential complexes.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/15 cursor-pointer self-start md:self-auto group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Add New Project</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects by name, location, or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
          >
            <div>
              {/* Cover Image */}
              <div className="relative h-48 bg-slate-950 overflow-hidden">
                <img
                  src={project.coverImage || "/uploads/aurea-exterior.png"}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      project.status === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{project.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">/{project.slug}</p>
                </div>

                {project.location?.address && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate">{project.location.address}</span>
                  </div>
                )}

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {project.description}
                </p>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>{project.apartments?.length || 0} Units Listed</span>
              </div>
              <a
                href={`/catalog?project=${project.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
              >
                <span>View Units</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !submitting && setIsModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Add New Real Estate Project</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Register a new residence development</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Résidence Aurea"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="residence-aurea"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Address / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. 14 Avenue Montaigne, 75008 Paris"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  placeholder="/uploads/aurea-exterior.png"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the architectural development, amenities, and location advantages..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-5 py-2.5 border border-slate-800 rounded-xl text-slate-400 text-sm font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/15 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Create Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
