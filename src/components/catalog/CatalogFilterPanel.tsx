"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, RefreshCw, ChevronDown, Check } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface CatalogFilterPanelProps {
  projects: Project[];
}

export default function CatalogFilterPanel({ projects }: CatalogFilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filter states
  const [project, setProject] = useState(searchParams.get("project") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minSurface, setMinSurface] = useState(searchParams.get("minSurface") || "");
  const [maxSurface, setMaxSurface] = useState(searchParams.get("maxSurface") || "");
  const [rooms, setRooms] = useState(searchParams.get("rooms") || "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("bedrooms") || "");
  const [orientation, setOrientation] = useState(searchParams.get("orientation") || "");
  const [balcony, setBalcony] = useState(searchParams.get("balcony") === "true");
  const [parking, setParking] = useState(searchParams.get("parking") === "true");
  const [status, setStatus] = useState(searchParams.get("status") || "AVAILABLE");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");

  // Sync state with URL params
  useEffect(() => {
    setProject(searchParams.get("project") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setMinSurface(searchParams.get("minSurface") || "");
    setMaxSurface(searchParams.get("maxSurface") || "");
    setRooms(searchParams.get("rooms") || "");
    setBedrooms(searchParams.get("bedrooms") || "");
    setOrientation(searchParams.get("orientation") || "");
    setBalcony(searchParams.get("balcony") === "true");
    setParking(searchParams.get("parking") === "true");
    setStatus(searchParams.get("status") || "AVAILABLE");
    setSortBy(searchParams.get("sortBy") || "newest");
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (project) params.set("project", project);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minSurface) params.set("minSurface", minSurface);
    if (maxSurface) params.set("maxSurface", maxSurface);
    if (rooms) params.set("rooms", rooms);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (orientation) params.set("orientation", orientation);
    if (balcony) params.set("balcony", "true");
    if (parking) params.set("parking", "true");
    if (status) params.set("status", status);
    if (sortBy) params.set("sortBy", sortBy);

    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push(pathname); // Clear all query params
  };

  return (
    <div className="glass border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 bg-white/40 dark:bg-slate-900/30 backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Search Filters</h3>
        </div>
        <button
          onClick={resetFilters}
          className="text-xs text-slate-500 hover:text-blue-500 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-5">
        {/* Project select */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Residential Project
          </label>
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status selection */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Unit Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="RESERVED">RESERVED</option>
            <option value="SOLD">SOLD</option>
            <option value="all">ALL UNITS</option>
          </select>
        </div>

        {/* Sort by option */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Sort Listings
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="newest">Newest Listings</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="surface_desc">Surface: Large to Small</option>
          </select>
        </div>

        {/* Price limits */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Price Range (DT)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Surface limits */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Surface Range (m²)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minSurface}
              onChange={(e) => setMinSurface(e.target.value)}
              className="w-1/2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxSurface}
              onChange={(e) => setMaxSurface(e.target.value)}
              className="w-1/2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Rooms / Bedrooms */}
        <div className="flex gap-3">
          <div className="w-1/2">
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Rooms
            </label>
            <input
              type="number"
              placeholder="Any"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none"
            />
          </div>
          <div className="w-1/2">
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Bedrooms
            </label>
            <input
              type="number"
              placeholder="Any"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Orientation select */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Orientation
          </label>
          <input
            type="text"
            placeholder="e.g. South, West..."
            value={orientation}
            onChange={(e) => setOrientation(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Balcony & Parking Switches */}
        <div className="flex flex-col gap-3 pt-2">
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={balcony}
              onChange={(e) => setBalcony(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-blue-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
            />
            <span>Must have Balcony</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={parking}
              onChange={(e) => setParking(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-blue-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
            />
            <span>Must have Parking</span>
          </label>
        </div>
      </div>

      <button
        onClick={applyFilters}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/10 cursor-pointer"
      >
        Apply Search Filters
      </button>
    </div>
  );
}
