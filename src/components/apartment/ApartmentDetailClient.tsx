"use client";

import React, { useState } from "react";
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
  DollarSign
} from "lucide-react";
import MortgageCalculator from "./MortgageCalculator";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-slate-200 dark:bg-slate-900 rounded-3xl animate-pulse flex items-center justify-center text-slate-500 text-xs">
      Loading map coordinates...
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
  project: Project;
  documents: Document[];
}

interface ApartmentDetailClientProps {
  apartment: Apartment;
  similarApartments: any[];
}

export default function ApartmentDetailClient({ apartment, similarApartments }: ApartmentDetailClientProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showFloorPlan, setShowFloorPlan] = useState(false);

  const images = apartment.gallery.length > 0 
    ? apartment.gallery 
    : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&h=600&q=80"];

  const address = apartment.project?.location?.address || "";
  const lat = apartment.project?.location?.lat || 48.8566;
  const lng = apartment.project?.location?.lng || 2.3522;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-24">
      {/* Detail Header bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-500 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </Link>

        {/* Title and reference */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-850 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                REF: {apartment.reference}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                apartment.status === "AVAILABLE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                "bg-slate-500/10 text-slate-400 border border-slate-500/20"
              }`}>
                {apartment.status}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl leading-tight">
              {apartment.title}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{address}</span>
            </div>
          </div>
          <div className="text-left md:text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Asking Price</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">
              {apartment.price.toLocaleString()} DT
            </span>
          </div>
        </div>
      </div>

      {/* Main Page Layout Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left 2 Columns: Media, Description, Map */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Gallery Section */}
            <div className="space-y-4">
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-lg">
                <img
                  src={images[activeImageIdx]}
                  alt={apartment.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Thumbnails grid */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        activeImageIdx === idx ? "border-blue-500 scale-95" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Core specs strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white dark:bg-slate-900/20 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl backdrop-blur-xl">
              <div className="text-center p-3 border-r border-slate-100 dark:border-slate-800/50 last:border-none">
                <Square className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Surface Area</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block mt-1">{apartment.surface} m²</span>
              </div>
              <div className="text-center p-3 border-r border-slate-100 dark:border-slate-800/50 last:border-none">
                <BedDouble className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Bedrooms</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block mt-1">{apartment.bedrooms} Bed</span>
              </div>
              <div className="text-center p-3 border-r border-slate-100 dark:border-slate-800/50 last:border-none">
                <Bath className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Bathrooms</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block mt-1">{apartment.bathrooms} Bath</span>
              </div>
              <div className="text-center p-3 last:border-none">
                <Compass className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Orientation</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block mt-1">{apartment.orientation}</span>
              </div>
            </div>

            {/* Description details */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Property Description</h2>
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900/10 border border-slate-200 dark:border-slate-850 rounded-3xl p-6">
                {apartment.description}
              </div>
            </div>

            {/* Floor plan drawing toggle */}
            {apartment.floorPlanUrl && (
              <div className="bg-white dark:bg-slate-900/20 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Floor Plan Drawing</h3>
                  <button
                    onClick={() => setShowFloorPlan(!showFloorPlan)}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-400 cursor-pointer"
                  >
                    {showFloorPlan ? "Hide Layout" : "View Layout"}
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
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Location Map</h2>
              <MapComponent lat={lat} lng={lng} address={address} />
            </div>

          </div>

          {/* Right 1 Column: Sticky sidebar action triggers */}
          <div className="space-y-8 lg:sticky lg:top-8">
            
            {/* Action Box */}
            <div className="glass border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 bg-white/40 dark:bg-slate-900/30 backdrop-blur-xl space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Residency Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{apartment.price.toLocaleString()} DT</span>
                  <span className="text-xs text-slate-500 font-medium">VAT excl.</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Ask AI Advisor trigger */}
                <Link
                  href={`/chat?apartment=${apartment.reference}`}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/10 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Consult AI Advisor</span>
                </Link>
                
                {/* Book a visit trigger */}
                <Link
                  href={`/chat?apartment=${apartment.reference}&book=true`}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Schedule Site Tour</span>
                </Link>
              </div>

              {/* Special specs lists */}
              <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 space-y-3 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Development Project:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{apartment.project?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Building Floor:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Floor {apartment.floor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Balcony Terrace:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{apartment.balcony ? "Available" : "None"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Secure Parking:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{apartment.parking ? "Included" : "None"}</span>
                </div>
              </div>
            </div>

            {/* Mortgage Calculator component */}
            <MortgageCalculator price={apartment.price} />

            {/* Brochures and Documents */}
            {apartment.documents && apartment.documents.length > 0 && (
              <div className="glass border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 bg-white/40 dark:bg-slate-900/30 backdrop-blur-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Brochures & Documents</h3>
                </div>
                <div className="space-y-2">
                  {apartment.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-700 rounded-xl transition-all group"
                    >
                      <div className="truncate pr-4 space-y-0.5">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate block group-hover:text-blue-400 transition-colors">
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
