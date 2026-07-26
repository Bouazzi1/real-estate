"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, Sparkles, Globe, Menu, X } from "lucide-react";
import { useTranslation } from "@/components/providers/LanguageProvider";

interface HeaderProps {
  agencyName: string;
  logoUrl: string | null;
}

export default function Header({ agencyName, logoUrl }: HeaderProps) {
  const { locale, setLocale, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showLang, setShowLang] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-slate-200/40 dark:border-slate-800/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-800" />
          ) : (
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500">
              <Building2 className="w-5 h-5" />
            </div>
          )}
          <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-blue-500 transition-colors">
            {agencyName}
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          <Link href="/catalog" className="hover:text-blue-500 transition-colors">
            {t("navApartments")}
          </Link>
          <Link href="#about" className="hover:text-blue-500 transition-colors">
            {t("navAbout")}
          </Link>
          <Link href="#testimonials" className="hover:text-blue-500 transition-colors">
            {t("navTestimonials")}
          </Link>
          <Link href="/chat" className="hover:text-blue-500 transition-colors flex items-center gap-1.5 text-blue-500 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("navAiAdvisor")}</span>
          </Link>
        </nav>

        {/* Actions & Language Selector */}
        <div className="hidden md:flex items-center gap-4 relative">
          {/* Language Selector Dropdown Button */}
          <button
            onClick={() => setShowLang(!showLang)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>{locale}</span>
          </button>
          
          {showLang && (
            <div className="absolute right-36 top-12 w-28 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden py-1 z-50 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <button
                onClick={() => { setLocale("en"); setShowLang(false); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer block"
              >
                English
              </button>
              <button
                onClick={() => { setLocale("fr"); setShowLang(false); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer block"
              >
                Français
              </button>
              <button
                onClick={() => { setLocale("ar"); setShowLang(false); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer block"
              >
                العربية (RTL)
              </button>
            </div>
          )}

          <Link
            href="/catalog"
            className="flex items-center justify-center py-2.5 px-4 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
          >
            {t("exploreBtn")}
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={() => setLocale(locale === "en" ? "fr" : locale === "fr" ? "ar" : "en")}
            className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-[10px] font-extrabold uppercase text-blue-500 cursor-pointer"
          >
            {locale}
          </button>
          <button
            onClick={toggleMenu}
            className="p-2 text-slate-500 hover:text-slate-200 rounded-xl cursor-pointer"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile drop menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 px-6 py-6 space-y-4 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-350">
          <Link href="/catalog" onClick={toggleMenu} className="block py-2 hover:text-blue-500">
            {t("navApartments")}
          </Link>
          <Link href="#about" onClick={toggleMenu} className="block py-2 hover:text-blue-500">
            {t("navAbout")}
          </Link>
          <Link href="#testimonials" onClick={toggleMenu} className="block py-2 hover:text-blue-500">
            {t("navTestimonials")}
          </Link>
          <Link href="/chat" onClick={toggleMenu} className="block py-2 hover:text-blue-500 flex items-center gap-1.5 text-blue-500 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("navAiAdvisor")}</span>
          </Link>
        </div>
      )}
    </header>
  );
}
