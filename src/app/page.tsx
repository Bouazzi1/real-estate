import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/navigation/Header";
import {
  Building2,
  CheckCircle,
  MessageCircle,
  Calendar,
  Compass,
  Square,
  BedDouble,
  ArrowRight,
  TrendingUp,
  MapPin,
  Star,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles
} from "lucide-react";

export const revalidate = 60; // ISR cache revalidation (60 seconds)

interface PageProps {
  searchParams: Promise<{
    preview?: string;
  }>;
}

export default async function LandingPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const isPreview = resolvedSearchParams.preview === "true";

  // 1. Fetch CMS sections ordered by 'order'
  let sections: any[] = [];
  try {
    sections = await prisma.cmsSection.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    });
  } catch (e) {
    console.error("Failed to load CMS sections for landing page:", e);
  }

  // 2. Fetch Featured Apartments
  let featuredApartments: any[] = [];
  try {
    featuredApartments = await prisma.apartment.findMany({
      where: { featured: true, status: "AVAILABLE" },
      include: {
        project: {
          select: {
            name: true,
            location: true,
          },
        },
      },
      take: 3,
    });
  } catch (e) {
    console.error("Failed to load featured apartments:", e);
  }

  // 3. Fetch Site Settings
  let settings: any = null;
  try {
    settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
  } catch (e) {
    console.error("Failed to load site settings:", e);
  }

  const agencyPhone = settings?.contactPhone || "+1 (555) 019-2834";
  const agencyEmail = settings?.contactEmail || "sales@elysiumrealestate.com";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      {/* Dynamic Header with language switcher */}
      <Header
        agencyName={settings?.agencyName || "Elysium Residences"}
        logoUrl={settings?.logoUrl || null}
      />

      {/* Render Dynamic Sections */}
      <div className="flex-1">
        {sections.map((section) => {
          // Determine whether to use draft content or published content
          const content = isPreview && section.draft ? section.draft : section.content;

          switch (section.key) {
            case "HERO":
              return (
                <section key={section.id} className="relative min-h-[85vh] flex items-center justify-center bg-gradient-to-b from-slate-100 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-800/80 px-6 overflow-hidden">
                  {/* Background cover image */}
                  {content.backgroundUrl && (
                    <div className="absolute inset-0 w-full h-full z-0">
                      <img
                        src={content.backgroundUrl}
                        alt="Elysium Hero background"
                        className="w-full h-full object-cover opacity-75 dark:opacity-35 transition-opacity"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/60 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-slate-950/20"
                        style={{ opacity: content.overlayOpacity ? content.overlayOpacity * 0.7 : 0.4 }}
                      />
                    </div>
                  )}

                  {/* Hero Text */}
                  <div className="max-w-4xl w-full text-center relative z-10 space-y-8 py-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Next-Gen RAG AI Sales Agent Active</span>
                    </div>
                    
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight font-display animate-slideUp">
                      {content.headline}
                    </h1>
                    
                    <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400 text-sm sm:text-lg font-medium leading-relaxed animate-slideUp-delay-1">
                      {content.subheadline}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                      {content.primaryCta && (
                        <Link
                          href={content.primaryCta.link || "/catalog"}
                          className="w-full sm:w-auto flex items-center justify-center py-3.5 px-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-2xl transition-all shadow-lg shadow-amber-500/20 group cursor-pointer"
                        >
                          <span>{content.primaryCta.text}</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      )}
                      {content.secondaryCta && (
                        <Link
                          href="/chat"
                          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-8 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4 text-amber-400" />
                          <span>{content.secondaryCta.text}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </section>
              );

            case "STATS":
              return (
                <section key={section.id} className="py-12 bg-white dark:bg-slate-900 border-t border-b border-slate-200/60 dark:border-slate-800/60 shadow-xs relative z-10">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
                      {content.items?.map((item: any, idx: number) => (
                        <div key={idx} className="pt-6 sm:pt-0 sm:px-6 first:pt-0">
                          <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {item.number}{item.suffix}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-2">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );

            case "FEATURED":
              return (
                <section key={section.id} className="py-24 bg-slate-50/70 dark:bg-slate-950">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="text-center max-w-2xl mx-auto space-y-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-500">RÉSIDENCES</span>
                      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display sm:text-4xl tracking-tight">
                        {content.title || "Premium Listings"}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {content.subtitle || "Handpicked properties displaying state-of-the-art details."}
                      </p>
                    </div>

                    {featuredApartments.length === 0 ? (
                      <div className="text-center text-slate-500 text-xs py-10">
                        No featured listings available at the moment.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {featuredApartments.map((apt) => {
                          const coverImage = apt.gallery[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&h=400&q=80";
                          const address = apt.project?.location?.address || "";

                          return (
                            <div
                              key={apt.id}
                              className="group flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-amber-500/5 hover:-translate-y-1 backdrop-blur-xl"
                            >
                              <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                                <img
                                  src={coverImage}
                                  alt={apt.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute top-4 left-4">
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-md">
                                    AVAILABLE
                                  </span>
                                </div>
                              </div>

                              <div className="p-6 space-y-4">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                                        REF: {apt.reference}
                                      </span>
                                      <span className="text-base font-bold text-slate-900 dark:text-white">
                                      {apt.price.toLocaleString()} DT
                                    </span>
                                  </div>
                                  <Link href={`/apartments/${apt.slug}`} className="block">
                                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-500 transition-colors">
                                      {apt.title}
                                    </h3>
                                  </Link>
                                </div>

                                <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 dark:border-slate-800/60 py-3 text-[10px] text-slate-600 dark:text-slate-400 text-center">
                                  <div>
                                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{apt.surface} m²</span>
                                    <span className="text-[9px] text-slate-500 block mt-0.5">Surface</span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{apt.bedrooms} Bed</span>
                                    <span className="text-[9px] text-slate-500 block mt-0.5">Rooms</span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{apt.orientation}</span>
                                    <span className="text-[9px] text-slate-500 block mt-0.5">Facing</span>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Link
                                    href={`/apartments/${apt.slug}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                                  >
                                    <span>Details</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              );

            case "ABOUT":
              return (
                <section key={section.id} id="about" className="py-24 bg-white dark:bg-slate-900/10 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                      {/* Left: About Text */}
                      <div className="space-y-6">
                        <span className="text-xs font-bold uppercase tracking-widest text-amber-500">QUI SOMMES-NOUS</span>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display sm:text-4xl tracking-tight leading-tight">
                          {content.title}
                        </h2>
                        <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                          {content.description}
                        </p>
                        
                        {/* Features list */}
                        <div className="space-y-4 pt-4">
                          {content.features?.map((feat: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="p-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-600 mt-0.5">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{feat.title}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">High-fidelity specifications guaranteed in design layout.</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Cover Photo */}
                      {content.imageUrl && (
                        <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 aspect-video lg:aspect-square shadow-xl">
                          <img src={content.imageUrl} alt="About image" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );

            case "TESTIMONIALS":
              return (
                <section key={section.id} id="testimonials" className="py-24 bg-slate-50/70 dark:bg-slate-950">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-500">AVIS CLIENTS</span>
                      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display sm:text-4xl tracking-tight">
                        {content.title || "Client Testimonials"}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {content.items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-8 bg-white dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xs backdrop-blur-xl hover:shadow-md transition-shadow flex flex-col justify-between gap-6"
                        >
                          <p className="text-slate-500 text-sm leading-relaxed italic">
                            "{item.text}"
                          </p>
                          <div className="flex items-center gap-3">
                            {item.photo && (
                              <img
                                src={item.photo}
                                alt={item.name}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-800"
                              />
                            )}
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h4>
                              <div className="flex gap-0.5 mt-1 text-amber-500">
                                {Array.from({ length: item.rating || 5 }).map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );

            case "CTA":
              return (
                <section key={section.id} className="py-24 bg-slate-900 text-white rounded-3xl my-12 mx-4 sm:mx-8 overflow-hidden shadow-2xl relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-900/10 to-transparent" />
                  <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-6">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight leading-tight">
                      {content.title}
                    </h2>
                    <p className="max-w-xl mx-auto text-slate-400 text-sm leading-relaxed">
                      {content.description}
                    </p>
                    <div className="pt-4">
                      {content.buttonText && (
                        <Link
                          href={content.buttonLink || "/catalog"}
                          className="inline-flex items-center gap-2 py-3.5 px-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-2xl transition-all shadow-lg cursor-pointer"
                        >
                          <span>{content.buttonText}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </section>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Footer block */}
      <footer className="bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-900/60 py-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo brand info */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white font-display text-lg tracking-tight">
              {settings?.agencyName || "Elysium Residences"}
            </h3>
            <p className="text-xs max-w-sm leading-relaxed text-slate-500">
              Résidences de prestige conçues pour un style de vie moderne. Accompagnement personnalisé par notre assistant IA commercial.
            </p>
            <div className="space-y-2 text-xs font-medium pt-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{agencyPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{agencyEmail}</span>
              </div>
            </div>
          </div>

          {/* Render footer columns from CMS if exists */}
          {sections.find((s) => s.key === "FOOTER")?.content?.columns?.map((col: any, idx: number) => (
            <div key={idx} className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{col.title}</h4>
              <ul className="space-y-2 text-xs">
                {col.links?.map((link: any, i: number) => (
                  <li key={i}>
                    <Link href={link.url} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )) || (
            <>
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Découvrir</h4>
                <ul className="space-y-2 text-xs">
                  <li><Link href="/catalog" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Catalogue</Link></li>
                  <li><Link href="/chat" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Conseiller IA</Link></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Mentions Légales</h4>
                <ul className="space-y-2 text-xs">
                  <li><Link href="/privacy" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Politique de Confidentialité</Link></li>
                  <li><Link href="/terms" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Conditions d'Utilisation</Link></li>
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-200/60 dark:border-slate-900/60 mt-12 pt-8 text-center text-[10px] text-slate-500 dark:text-slate-500">
          <p>{sections.find((s) => s.key === "FOOTER")?.content?.copyright || `© 2026 ${settings?.agencyName || "Elysium Residences"}. All rights reserved.`}</p>
        </div>
      </footer>
    </div>
  );
}
