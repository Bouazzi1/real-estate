"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Locale = "en" | "fr" | "ar";

const translations = {
  en: {
    navApartments: "Apartments",
    navAbout: "About Us",
    navTestimonials: "Testimonials",
    navAiAdvisor: "AI Advisor",
    exploreBtn: "Explore Units",
    askingPrice: "Asking Price",
    surfaceArea: "Surface Area",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    orientation: "Orientation",
    floorPlan: "Floor Plan Drawing",
    locationMap: "Location Map",
    scheduleTour: "Schedule Site Tour",
    consultAdvisor: "Consult AI Advisor",
    similarApartments: "Similar Properties",
    features: "Features",
    balcony: "Balcony",
    parking: "Parking",
    floor: "Floor",
  },
  fr: {
    navApartments: "Appartements",
    navAbout: "À Propos",
    navTestimonials: "Témoignages",
    navAiAdvisor: "Conseiller IA",
    exploreBtn: "Découvrir les Biens",
    askingPrice: "Prix demandé",
    surfaceArea: "Superficie",
    bedrooms: "Chambres",
    bathrooms: "Salles de bain",
    orientation: "Orientation",
    floorPlan: "Plan de l'appartement",
    locationMap: "Plan d'accès",
    scheduleTour: "Planifier une visite",
    consultAdvisor: "Consulter l'IA",
    similarApartments: "Propriétés Similaires",
    features: "Prestations",
    balcony: "Balcon",
    parking: "Parking",
    floor: "Étage",
  },
  ar: {
    navApartments: "الشقق",
    navAbout: "من نحن",
    navTestimonials: "آراء العملاء",
    navAiAdvisor: "مستشار الذكاء الاصطناعي",
    exploreBtn: "استكشاف الوحدات",
    askingPrice: "السعر المطلوب",
    surfaceArea: "المساحة",
    bedrooms: "غرف النوم",
    bathrooms: "دورات المياه",
    orientation: "الاتجاه",
    floorPlan: "مخطط الطابق",
    locationMap: "خريطة الموقع",
    scheduleTour: "حجز موعد زيارة",
    consultAdvisor: "استشارة المساعد الذكي",
    similarApartments: "عقارات مشابهة",
    features: "المميزات",
    balcony: "شرفة",
    parking: "موقف سيارات",
    floor: "الطابق",
  },
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Load language from storage if exists
  useEffect(() => {
    const saved = localStorage.getItem("elysium_lang") as Locale;
    if (saved && (saved === "en" || saved === "fr" || saved === "ar")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("elysium_lang", newLocale);
    
    // Manage RTL layout direction on document HTML element
    if (typeof window !== "undefined") {
      const html = document.documentElement;
      html.lang = newLocale;
      if (newLocale === "ar") {
        html.dir = "rtl";
      } else {
        html.dir = "ltr";
      }
    }
  };

  // Sync RTL attributes on initial mount
  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    if (locale === "ar") {
      html.dir = "rtl";
    } else {
      html.dir = "ltr";
    }
  }, [locale]);

  const t = (key: keyof typeof translations.en) => {
    return translations[locale][key] || translations.en[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
