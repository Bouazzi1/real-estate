import React from "react";
import { prisma } from "@/lib/prisma";
import CatalogFilterPanel from "@/components/catalog/CatalogFilterPanel";
import Link from "next/link";
import { Building2, Square, BedDouble, Bath, MapPin, Compass, ArrowRight, MessageCircle } from "lucide-react";
import Header from "@/components/navigation/Header";

export const revalidate = 0; // Ensure live data updates are fetched on filter change

interface CatalogPageProps {
  searchParams: Promise<{
    project?: string;
    minPrice?: string;
    maxPrice?: string;
    minSurface?: string;
    maxSurface?: string;
    rooms?: string;
    bedrooms?: string;
    orientation?: string;
    balcony?: string;
    parking?: string;
    status?: string;
    sortBy?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedSearchParams = await searchParams;
  // Parse query parameters
  const projectId = resolvedSearchParams.project || undefined;
  const minPrice = resolvedSearchParams.minPrice ? parseFloat(resolvedSearchParams.minPrice) : undefined;
  const maxPrice = resolvedSearchParams.maxPrice ? parseFloat(resolvedSearchParams.maxPrice) : undefined;
  const minSurface = resolvedSearchParams.minSurface ? parseFloat(resolvedSearchParams.minSurface) : undefined;
  const maxSurface = resolvedSearchParams.maxSurface ? parseFloat(resolvedSearchParams.maxSurface) : undefined;
  const rooms = resolvedSearchParams.rooms ? parseInt(resolvedSearchParams.rooms) : undefined;
  const bedrooms = resolvedSearchParams.bedrooms ? parseInt(resolvedSearchParams.bedrooms) : undefined;
  const orientation = resolvedSearchParams.orientation || undefined;
  const balcony = resolvedSearchParams.balcony === "true" ? true : undefined;
  const parking = resolvedSearchParams.parking === "true" ? true : undefined;
  
  // By default, filter by status = AVAILABLE unless status is explicitly provided as "all" or a filter
  let statusFilter: any = "AVAILABLE";
  if (resolvedSearchParams.status === "all") {
    statusFilter = undefined;
  } else if (resolvedSearchParams.status) {
    statusFilter = resolvedSearchParams.status;
  }

  // Parse sorting options
  let orderBy: any = { createdAt: "desc" };
  if (resolvedSearchParams.sortBy === "price_asc") {
    orderBy = { price: "asc" };
  } else if (resolvedSearchParams.sortBy === "price_desc") {
    orderBy = { price: "desc" };
  } else if (resolvedSearchParams.sortBy === "surface_desc") {
    orderBy = { surface: "desc" };
  }

  // Query matching apartments
  const apartments = await prisma.apartment.findMany({
    where: {
      projectId,
      price: {
        gte: minPrice,
        lte: maxPrice,
      },
      surface: {
        gte: minSurface,
        lte: maxSurface,
      },
      rooms,
      bedrooms,
      orientation: orientation
        ? {
            contains: orientation,
            mode: "insensitive",
          }
        : undefined,
      balcony,
      parking,
      status: statusFilter,
    },
    include: {
      project: {
        select: {
          name: true,
          location: true,
        },
      },
    },
    orderBy,
  });

  // Query projects for filter dropdown
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch site settings for Header
  let settings: any = null;
  try {
    settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  } catch (e) {}

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <Header agencyName={settings?.agencyName || "Résidence WAFA"} logoUrl={settings?.logoUrl || "/uploads/folla-logo.png"} />

      {/* Catalog Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 py-16 px-6 relative overflow-hidden shadow-xs">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/5 via-slate-50/50 dark:from-amber-900/20 dark:via-slate-900/10 to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Catalogue Premium</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl font-display">Résidences Disponibles</h1>
          <p className="max-w-2xl text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Parcourez notre collection de résidences d'exception. Filtrez par budget, superficie et prestations pour trouver votre suite idéale.
          </p>
        </div>
      </div>

      {/* Main Grid workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Panel: Filters */}
          <div className="lg:col-span-1">
            <React.Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading filters...</div>}>
              <CatalogFilterPanel projects={projects} />
            </React.Suspense>
          </div>

          {/* Right Panel: Listings */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
              <span className="text-xs font-semibold text-slate-500">
                Affichage de <span className="text-slate-900 dark:text-white font-bold">{apartments.length}</span> appartements correspondants
              </span>
            </div>

            {apartments.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs backdrop-blur-xl p-12">
                <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Aucun Bien Trouvé</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
                  Aucun appartement ne correspond à vos critères de recherche. Essayez de réinitialiser les filtres ou d'élargir votre budget.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {apartments.map((apt) => {
                  const coverImage = apt.gallery[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&h=400&q=80";
                  const address = (apt.project?.location as any)?.address || "";

                  return (
                    <div
                      key={apt.id}
                      className="group flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 backdrop-blur-xl relative"
                    >
                      {/* Image Frame */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                        <img
                          src={coverImage}
                          alt={apt.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            apt.status === "AVAILABLE" ? "bg-emerald-500/90 text-white backdrop-blur-md" :
                            "bg-slate-900/90 text-slate-100 backdrop-blur-md"
                          }`}>
                            {apt.status}
                          </span>
                          {apt.featured && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-955 text-[9px] font-bold uppercase tracking-wider backdrop-blur-md">
                              FEATURED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">
                              REF: {apt.reference}
                            </span>
                            <span className="text-lg font-bold text-slate-900">
                              {apt.price.toLocaleString()} DT
                            </span>
                          </div>
                          
                          <Link href={`/apartments/${apt.slug}`} className="block group/link">
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover/link:text-amber-500 transition-colors">
                              {apt.title}
                            </h3>
                          </Link>

                          <div className="flex items-center gap-1 text-[11px] text-slate-600">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{address}</span>
                          </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 dark:border-slate-800/80 py-3 text-[11px] text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5 justify-center">
                            <Square className="w-3.5 h-3.5 text-slate-400" />
                            <span>{apt.surface} m²</span>
                          </div>
                          <div className="flex items-center gap-1.5 justify-center">
                            <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                            <span>{apt.bedrooms} Bed</span>
                          </div>
                          <div className="flex items-center gap-1.5 justify-center">
                            <Compass className="w-3.5 h-3.5 text-slate-400" />
                            <span>{apt.orientation}</span>
                          </div>
                        </div>

                        {/* Actions footer */}
                        <div className="flex gap-3 pt-2">
                          <Link
                            href={`/apartments/${apt.slug}`}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                          >
                            <span>Voir Détails</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          
                          {/* Chat prompt trigger */}
                          <Link
                            href={`/chat?apartment=${apt.reference}`}
                            title="Chat about this apartment"
                            className="p-2.5 bg-amber-500/10 hover:bg-amber-500 hover:text-white border border-amber-500/20 text-amber-500 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Link>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
