"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  X,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Tag
} from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface Apartment {
  id: string;
  title: string;
  reference: string;
}

interface Document {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  indexedAt: string | null;
  createdAt: string;
  apartmentId: string | null;
  projectId: string | null;
  apartment?: {
    id: string;
    title: string;
    reference: string;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
}

interface DocumentsClientProps {
  initialProjects: Project[];
  initialApartments: Apartment[];
}

export default function DocumentsClient({ initialProjects, initialApartments }: DocumentsClientProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState("BROCHURE");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedApartmentId, setSelectedApartmentId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Action loading states
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch documents list on mount
  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/admin/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error("Failed to load documents:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto populate title if empty
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a document file to upload.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      // 1. Upload the file binary to retrieval store
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);

      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "File upload failed");
      }

      const { url: fileUrl } = await uploadRes.json();

      // 2. Save document specs & trigger indexer
      const docPayload = {
        title,
        type,
        fileUrl,
        mimeType: selectedFile.type,
        sizeBytes: selectedFile.size,
        apartmentId: selectedApartmentId || null,
        projectId: selectedProjectId || null,
      };

      const docRes = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docPayload),
      });

      if (!docRes.ok) {
        const err = await docRes.json();
        throw new Error(err.error || "Document creation failed");
      }

      // Success
      setIsUploadOpen(false);
      resetForm();
      fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || "An unexpected error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setType("BROCHURE");
    setSelectedFile(null);
    setSelectedApartmentId("");
    setSelectedProjectId("");
    setUploadError("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document? This will remove all associated AI RAG vector chunks.")) {
      return;
    }

    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/documents/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDocuments(documents.filter((doc) => doc.id !== id));
      } else {
        alert("Failed to delete document.");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting document.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReindex = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/documents/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reindex" }),
      });

      if (res.ok) {
        const updatedDoc = await res.json();
        setDocuments(documents.map((doc) => (doc.id === id ? updatedDoc : doc)));
      } else {
        const err = await res.json();
        alert(err.error || "Indexing failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Error triggering reindex.");
    } finally {
      setProcessingId(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.apartment?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.apartment?.reference || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.project?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Document Repository</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage brochures, floor plans, and legal sheets. PDFs are automatically parsed and indexed for the RAG AI Sales Assistant.
          </p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/15 cursor-pointer self-start md:self-auto group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents by title, type, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Documents Grid Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl shadow-xl overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm">Loading document entries...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
            <div className="p-4 rounded-full bg-slate-950/60 border border-slate-800">
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-white">No documents found</h3>
              <p className="text-sm text-slate-400">
                {searchQuery ? "No matches found for your filter query." : "Upload a PDF brochure to index RAG context."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Document Info</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Association</th>
                  <th className="py-4 px-6">File Size</th>
                  <th className="py-4 px-6">Vector Ingestion</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {filteredDocs.map((doc) => {
                  const isPdf = doc.mimeType === "application/pdf";
                  return (
                    <tr key={doc.id} className="hover:bg-slate-950/30 transition-colors">
                      {/* Doc Title & Link */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-white hover:text-blue-400 flex items-center gap-1 transition-colors"
                            >
                              <span>{doc.title}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <span className="text-xs text-slate-500 mt-0.5 block">
                              Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-950 border border-slate-800 text-slate-300">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {doc.type}
                        </span>
                      </td>

                      {/* Associated Project / Apartment */}
                      <td className="py-4 px-6">
                        {doc.apartment ? (
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/10">
                              {doc.apartment.reference}
                            </span>
                            <span className="block text-xs text-slate-400 truncate max-w-[150px]">
                              {doc.apartment.title}
                            </span>
                          </div>
                        ) : doc.project ? (
                          <div className="flex items-center gap-1.5 text-xs text-indigo-400">
                            <Building2 className="w-3.5 h-3.5" />
                            <span className="font-medium truncate max-w-[150px]">{doc.project.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">Global System</span>
                        )}
                      </td>

                      {/* Size */}
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">
                        {formatBytes(doc.sizeBytes)}
                      </td>

                      {/* Ingestion Status badge */}
                      <td className="py-4 px-6">
                        {isPdf ? (
                          doc.indexedAt ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Indexed</span>
                              </span>
                              <span className="block text-[10px] text-slate-500 font-mono">
                                {new Date(doc.indexedAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                              <span>Pending Index</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-500">
                            <span>Non-RAG Format</span>
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPdf && (
                            <button
                              onClick={() => handleReindex(doc.id)}
                              disabled={processingId === doc.id}
                              title="Re-run RAG Vector Ingestion"
                              className="p-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-blue-400 border border-slate-800 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                            >
                              {processingId === doc.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={processingId === doc.id}
                            title="Delete Document"
                            className="p-2 bg-slate-950 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                          >
                            {processingId === doc.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => {
              if (!uploading) setIsUploadOpen(false);
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Upload New Document</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Define metadata and index for vector search</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                disabled={uploading}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {uploadError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {uploadError}
                </div>
              )}

              {/* File input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select Document File
                </label>
                <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-colors relative flex flex-col items-center justify-center bg-slate-950/40">
                  <input
                    type="file"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <Upload className="w-8 h-8 text-slate-600 mb-2" />
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-blue-400 truncate max-w-[250px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {formatBytes(selectedFile.size)} - {selectedFile.type || "unknown mime"}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-slate-400">Click or drag file to upload</p>
                      <p className="text-xs text-slate-500">Supports PDF, DOCX, TXT, images (Max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skyline Penthouse Brochure"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={uploading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-700"
                />
              </div>

              {/* Document Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Document Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={uploading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="BROCHURE">Brochure</option>
                  <option value="FLOOR_PLAN">Floor Plan</option>
                  <option value="DESIGN">Architectural Design</option>
                  <option value="PRICE_SHEET">Price List</option>
                  <option value="FAQ">Frequently Asked Questions (FAQ)</option>
                  <option value="LEGAL">Legal / Terms Sheet</option>
                </select>
              </div>

              {/* Associated Project dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Associate with Project (Optional)
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    if (e.target.value) setSelectedApartmentId(""); // clear apartment if project chosen
                  }}
                  disabled={uploading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">No Project Association</option>
                  {initialProjects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Associated Apartment dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Associate with Apartment (Optional)
                </label>
                <select
                  value={selectedApartmentId}
                  onChange={(e) => {
                    setSelectedApartmentId(e.target.value);
                    if (e.target.value) setSelectedProjectId(""); // clear project if apartment chosen
                  }}
                  disabled={uploading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">No Apartment Association</option>
                  {initialApartments.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      [{apt.reference}] {apt.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={uploading}
                  className="px-5 py-3 border border-slate-800 hover:bg-slate-800 hover:text-white rounded-xl text-slate-400 text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/15 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading & Indexing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Index</span>
                    </>
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
