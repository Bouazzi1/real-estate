"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Square,
  BedDouble,
  Bath,
  Compass,
  ArrowRight,
  MessageCircle,
  Calendar,
  FileText,
  MapPin,
  Sparkles,
  ArrowLeft,
  DollarSign,
  Video,
  Play,
  Image as ImageIcon,
  Film
} from "lucide-react";
import MortgageCalculator from "./MortgageCalculator";
import Header from "@/components/navigation/Header";
import { formatPrice } from "@/lib/formatters";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-slate-200 dark:bg-slate-900 rounded-3xl animate-pulse flex items-center justify-center text-slate-500 text-xs">
      Chargement de la carte...
    </div>
  ),
});

interface Project {
  name: string;
  location: any;
  description: string;
}

interface Document {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  sizeBytes: number;
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
  gallery: string[];
  floorPlanUrl: string | null;
  virtualTourUrl: string | null;
  videoUrl?: string | null;
  project: Project;
  documents: Document[];
}

interface ApartmentDetailClientProps {
  apartment: Apartment;
  similarApartments: any[];
}

export default function ApartmentDetailClient({ apartment, similarApartments }: ApartmentDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"photos" | "video" | "plan">("photos");
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [showFloorPlan, setShowFloorPlan] = useState(false);

  const images = apartment.gallery.length > 0 
    ? apartment.gallery 
    : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&h=600&q=80"];

  const address = apartment.project?.location?.address || "";
  const lat = apartment.project?.location?.lat || 48.8566;
  const lng = apartment.project?.location?.lng || 2.3522;

  const videoSource = apartment.videoUrl || apartment.virtualTourUrl;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      <Header agencyName="Résidence WAFA" logoUrl="/uploads/folla-logo.png" />
      {/* Detail Header bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-amber-500 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour au Catalogue</span>
        </Link>

        {/* Title and reference */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                RÉF: {apartment.reference}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                apartment.status === "AVAILABLE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                "bg-slate-500/10 text-slate-400 border border-slate-500/20"
              }`}>
                {apartment.status === "AVAILABLE" ? "DISPONIBLE" : apartment.status === "RESERVED" ? "RÉSERVÉ" : apartment.status === "SOLD" ? "VENDU" : apartment.status}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display sm:text-4xl leading-tight">
              {apartment.title}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{address}</span>
            </div>
          </div>
          <div className="text-left md:text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Prix Demandé</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">
              {formatPrice(apartment.price)} DT
            </span>
          </div>
        </div>
      </div>

      {/* Main Page Layout Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left 2 Columns: Media, Description, Map */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Media Gallery Section with Video & Plan Tabs */}
            <div className="space-y-4">
              
              {/* Media Switcher Bar */}
              {(videoSource || apartment.floorPlanUrl) && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setActiveTab("photos"); setIsPlayingVideo(false); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "photos"
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Photos ({images.length})</span>
                    </button>

                    {videoSource && (
                      <button
                        onClick={() => { setActiveTab("video"); setIsPlayingVideo(true); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeTab === "video"
                            ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <Video className="w-4 h-4 text-rose-400" />
                        <span>Vidéo de Présentation</span>
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
                      </button>
                    )}

                    {apartment.floorPlanUrl && (
                      <button
                        onClick={() => { setActiveTab("plan"); setIsPlayingVideo(false); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeTab === "plan"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span>Plan 2D/3D</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline-block pr-3">
                    Qualité HD
                  </span>
                </div>
              )}

              {/* Main Media Frame */}
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-2xl group">
                
                {/* 1. Photos Tab */}
                {activeTab === "photos" && (
                  <img
                    src={images[activeImageIdx]}
                    alt={apartment.title}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                )}

                {/* 2. Video Tab */}
                {activeTab === "video" && videoSource && (
                  <div className="w-full h-full relative bg-slate-950 flex items-center justify-center">
                    {videoSource.endsWith(".mp4") || videoSource.includes("/uploads/") ? (
                      <video
                        src={videoSource}
                        controls
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <iframe
                        src={videoSource.includes("youtube.com") ? videoSource.replace("watch?v=", "embed/") : videoSource}
                        title="Visite Vidéo"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                )}

                {/* 3. Plan Tab */}
                {activeTab === "plan" && apartment.floorPlanUrl && (
                  <div className="w-full h-full bg-slate-950 p-4 flex items-center justify-center">
                    <img
                      src={apartment.floorPlanUrl}
                      alt="Plan de l'appartement"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
              
              {/* Thumbnails Strip */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {/* Photo thumbnails */}
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveImageIdx(idx); setActiveTab("photos"); }}
                    className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeTab === "photos" && activeImageIdx === idx ? "border-amber-500 scale-95" : "border-slate-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}

                {/* Video thumbnail trigger (only shown if videoSource exists) */}
                {videoSource && (
                  <button
                    onClick={() => { setActiveTab("video"); setIsPlayingVideo(true); }}
                    className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-rose-950/40 border-rose-500/40 flex flex-col items-center justify-center text-rose-400 hover:scale-95 ${
                      activeTab === "video" ? "border-rose-500 ring-2 ring-rose-500/20" : ""
                    }`}
                  >
                    <Video className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Vidéo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Core specs strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs backdrop-blur-xl">
              <div className="text-center p-3 border-r border-slate-100 dark:border-slate-800/50">
                <Square className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Superficie</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block mt-1">{apartment.surface} m²</span>
              </div>
              <div className="text-center p-3 border-r border-slate-100 dark:border-slate-800/50">
                <BedDouble className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Chambres</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block mt-1">{apartment.bedrooms} ch.</span>
              </div>
              <div className="text-center p-3 border-r border-slate-100 dark:border-slate-800/50">
                <Bath className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Salles de bain</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block mt-1">{apartment.bathrooms} sdb</span>
              </div>
              <div className="text-center p-3 last:border-none">
                <Compass className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Orientation</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block mt-1">{apartment.orientation}</span>
              </div>
            </div>

            {/* Description details */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Description du Bien</h2>
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed bg-white dark:bg-slate-900/20 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs text-slate-700 dark:text-slate-300">
                {apartment.description}
              </div>
            </div>

            {/* Floor plan drawing toggle */}
            {apartment.floorPlanUrl && (
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Plan de l'Appartement</h3>
                  <button
                    onClick={() => setShowFloorPlan(!showFloorPlan)}
                    className="text-xs font-semibold text-amber-500 hover:text-amber-400 cursor-pointer"
                  >
                    {showFloorPlan ? "Masquer le Plan" : "Voir le Plan"}
                  </button>
                </div>
                {showFloorPlan && (
                  <div className="border border-slate-800 rounded-2xl overflow-hidden aspect-video bg-slate-950 flex items-center justify-center">
                    <img src={apartment.floorPlanUrl} alt="floor plan" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            )}

            {/* Location Map */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Plan de Localisation</h2>
              <MapComponent lat={lat} lng={lng} address={address} />
            </div>

          </div>

          {/* Right 1 Column: Sticky sidebar action triggers */}
          <div className="space-y-8 lg:sticky lg:top-8">
            
            {/* Action Box */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm backdrop-blur-xl space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Prix de la Résidence</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{formatPrice(apartment.price)} DT</span>
                  <span className="text-xs text-slate-500 font-medium">HT</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Ask AI Advisor trigger */}
                <Link
                  href={`/chat?apartment=${apartment.reference}`}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Contacter le Conseiller Virtuel</span>
                </Link>
                
                {/* Book a visit trigger */}
                <Link
                  href={`/chat?apartment=${apartment.reference}&book=true`}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Planifier une Visite</span>
                </Link>
              </div>

              {/* Special specs lists */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Projet Immobilier :</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{apartment.project?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Étage :</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">Étage {apartment.floor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Terrasse / Balcon :</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{apartment.balcony ? "Disponible" : "Non"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Parking Sécurisé :</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{apartment.parking ? "Inclus" : "Non"}</span>
                </div>
              </div>
            </div>

            {/* Mortgage Calculator component */}
            <MortgageCalculator price={apartment.price} />

            {/* Brochures and Documents */}
            {apartment.documents && apartment.documents.length > 0 && (
              <div className="bg-white dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Brochures & Documents</h3>
                </div>
                <div className="space-y-2">
                  {apartment.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-500 rounded-xl transition-all group"
                    >
                      <div className="truncate pr-4 space-y-0.5">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block group-hover:text-blue-400 transition-colors">
                          {doc.title}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase block">
                          {doc.type} · {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
