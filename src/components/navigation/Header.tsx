"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, Sparkles, Globe, Menu, X, Sun, Moon } from "lucide-react";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useTheme } from "@/components/providers/ThemeProvider";

interface HeaderProps {
  agencyName: string;
  logoUrl: string | null;
}

export default function Header({ agencyName, logoUrl }: HeaderProps) {
  const { locale, setLocale, t } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showLang, setShowLang] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const displayLogo = logoUrl || "/uploads/folla-logo.png";

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl transition-all shadow-xs">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-20 md:h-24 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3.5 group shrink-0">
          <div className="relative p-1.5 md:p-2 rounded-2xl bg-white/95 dark:bg-slate-900 shadow-md shadow-amber-500/5 border border-amber-500/20 group-hover:border-amber-500/50 transition-all duration-300">
            <img
              src={displayLogo}
              alt={agencyName}
              className="h-10 sm:h-11 md:h-12 lg:h-13 w-auto max-w-[180px] sm:max-w-[220px] md:max-w-[250px] object-contain rounded-lg"
            />
          </div>
          <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-amber-500 transition-colors hidden 2xl:inline-block">
            {agencyName}
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-[11px] xl:text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 shrink-0">
          <Link href="/catalog" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            {t("navApartments")}
          </Link>
          <Link href="/#about" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            {t("navAbout")}
          </Link>
          <Link href="/#testimonials" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            {t("navTestimonials")}
          </Link>
          <Link
            href="/chat"
            className="hover:text-amber-600 transition-all flex items-center gap-2 text-rose-600 dark:text-amber-400 font-extrabold px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-amber-500/10 border border-rose-200/80 dark:border-amber-500/20 shadow-xs whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500 dark:text-amber-400 animate-pulse" />
            <span>{t("navAiAdvisor")}</span>
          </Link>
        </nav>

        {/* Actions, Theme Toggle & Language Selector */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-4 shrink-0 relative">
          
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            title={resolvedTheme === "dark" ? "Mode Clair" : "Mode Sombre"}
            className="p-2.5 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-amber-400 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {resolvedTheme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Language Selector Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowLang(!showLang)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-all cursor-pointer whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>{locale === "fr" ? "FR" : locale === "en" ? "EN" : "AR"}</span>
            </button>
            
            {showLang && (
              <div className="absolute right-0 top-12 w-36 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden py-1 z-50 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <button
                  onClick={() => { setLocale("fr"); setShowLang(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer flex items-center justify-between ${locale === "fr" ? "text-amber-500 font-bold" : ""}`}
                >
                  <span>Français</span>
                  {locale === "fr" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </button>
                <button
                  onClick={() => { setLocale("en"); setShowLang(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer flex items-center justify-between ${locale === "en" ? "text-amber-500 font-bold" : ""}`}
                >
                  <span>English</span>
                  {locale === "en" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </button>
                <button
                  onClick={() => { setLocale("ar"); setShowLang(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer flex items-center justify-between ${locale === "ar" ? "text-amber-500 font-bold" : ""}`}
                >
                  <span>العربية (RTL)</span>
                  {locale === "ar" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </button>
              </div>
            )}
          </div>

          <Link
            href="/catalog"
            className="flex items-center justify-center py-2.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            {t("exploreBtn")}
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-amber-400 cursor-pointer"
          >
            {resolvedTheme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
          <button
            onClick={() => setLocale(locale === "en" ? "fr" : locale === "fr" ? "ar" : "en")}
            className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 cursor-pointer"
          >
            {locale}
          </button>
          <button
            onClick={toggleMenu}
            className="p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl cursor-pointer"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile drop menu */}
      {isOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-lg px-6 py-6 space-y-4 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <Link href="/catalog" onClick={toggleMenu} className="block py-2 hover:text-amber-600 dark:hover:text-amber-400">
            {t("navApartments")}
          </Link>
          <Link href="/#about" onClick={toggleMenu} className="block py-2 hover:text-amber-600 dark:hover:text-amber-400">
            {t("navAbout")}
          </Link>
          <Link href="/#testimonials" onClick={toggleMenu} className="block py-2 hover:text-amber-600 dark:hover:text-amber-400">
            {t("navTestimonials")}
          </Link>
          <Link href="/chat" onClick={toggleMenu} className="block py-2 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 text-rose-600 dark:text-amber-400 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 dark:text-amber-400" />
            <span>{t("navAiAdvisor")}</span>
          </Link>
        </div>
      )}
    </header>
  );
}
