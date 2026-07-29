"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Locale = "fr" | "en" | "ar";

const translations = {
  fr: {
    // Nav & Common
    navApartments: "Appartements",
    navAbout: "À Propos",
    navTestimonials: "Témoignages",
    navAiAdvisor: "Conseiller Virtuel",
    exploreBtn: "Découvrir les Biens",
    searchPlaceholder: "Rechercher un appartement...",
    clearFilters: "Réinitialiser",
    reset: "Réinitialiser",
    all: "Tous",
    available: "Disponible",
    reserved: "Réservé",
    sold: "Vendu",

    // Specs & Apartment
    askingPrice: "Prix demandé",
    surfaceArea: "Superficie",
    bedrooms: "Chambres",
    bathrooms: "Salles de bain",
    orientation: "Orientation",
    floorPlan: "Plan de l'appartement",
    locationMap: "Plan d'accès",
    scheduleTour: "Planifier une visite",
    consultAdvisor: "Contacter le Conseiller",
    similarApartments: "Propriétés Similaires",
    features: "Prestations",
    balcony: "Balcon",
    parking: "Parking",
    floor: "Étage",
    backToCatalog: "Retour au Catalogue",
    description: "Description du Bien",
    priceHt: "DT HT",

    // Filters
    searchFilters: "Filtres de Recherche",
    minPrice: "Prix Min (DT)",
    maxPrice: "Prix Max (DT)",
    minSurface: "Surface Min (m²)",
    maxSurface: "Surface Max (m²)",
    roomsCount: "Nombre de pièces",
    bedroomsCount: "Nombre de chambres",
    options: "Options & Équipements",
    sortBy: "Trier par",
    newest: "Plus récents",
    priceAsc: "Prix croissant",
    priceDesc: "Prix décroissant",
    surfaceDesc: "Superficie décroissante",
    applyFilters: "Appliquer les filtres",

    // Chat
    wafaAdvisor: "Conseiller WAFA",
    advisorTitle: "Conseiller Commercial 24/7",
    chatWelcome: "Bonjour ! Je suis le Conseiller Virtuel pour la Résidence WAFA. Comment puis-je vous accompagner ?",
    typeMessage: "Posez vos questions sur la Résidence WAFA...",
    send: "Envoyer",
    resetChat: "Nouveau Chat",
    online: "En ligne",
    draftingReply: "Rédaction de la réponse...",

    // Admin Sidebar & Dashboard
    adminOverview: "Vue d'Ensemble",
    adminProjects: "Projets",
    adminApartments: "Appartements",
    adminDocuments: "Documents",
    adminAppointments: "Rendez-vous",
    adminLeads: "Prospects & Chats",
    adminCms: "CMS Vitrine",
    adminSettings: "Paramètres Site",
    adminSignOut: "Déconnexion",
    adminPanelTitle: "Administration WAFA",
    adminSalesPlatform: "Plateforme Commerciale",
    adminTotalRevenue: "Chiffre d'Affaires Réservé",
    adminPendingAppointments: "Visites en Attente",
    adminTotalLeads: "Total Prospects",
    adminHotLeads: "Leads Chauds (HOT)",
  },

  en: {
    // Nav & Common
    navApartments: "Apartments",
    navAbout: "About Us",
    navTestimonials: "Testimonials",
    navAiAdvisor: "Virtual Advisor",
    exploreBtn: "Explore Units",
    searchPlaceholder: "Search apartments...",
    clearFilters: "Reset Filters",
    reset: "Reset",
    all: "All",
    available: "Available",
    reserved: "Reserved",
    sold: "Sold",

    // Specs & Apartment
    askingPrice: "Asking Price",
    surfaceArea: "Surface Area",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    orientation: "Orientation",
    floorPlan: "Floor Plan Drawing",
    locationMap: "Location Map",
    scheduleTour: "Schedule Site Tour",
    consultAdvisor: "Contact Advisor",
    similarApartments: "Similar Properties",
    features: "Features",
    balcony: "Balcony",
    parking: "Parking",
    floor: "Floor",
    backToCatalog: "Back to Catalog",
    description: "Property Description",
    priceHt: "TND (Tax Excl.)",

    // Filters
    searchFilters: "Search Filters",
    minPrice: "Min Price (TND)",
    maxPrice: "Max Price (TND)",
    minSurface: "Min Surface (m²)",
    maxSurface: "Max Surface (m²)",
    roomsCount: "Number of Rooms",
    bedroomsCount: "Bedrooms",
    options: "Amenities & Features",
    sortBy: "Sort by",
    newest: "Newest",
    priceAsc: "Price: Low to High",
    priceDesc: "Price: High to Low",
    surfaceDesc: "Surface: High to Low",
    applyFilters: "Apply Filters",

    // Chat
    wafaAdvisor: "WAFA Advisor",
    advisorTitle: "24/7 Sales Advisor",
    chatWelcome: "Hello! I am your Virtual Sales Advisor for Résidence WAFA. How may I assist you today?",
    typeMessage: "Ask any question about Résidence WAFA...",
    send: "Send",
    resetChat: "New Chat",
    online: "Online",
    draftingReply: "Drafting response...",

    // Admin Sidebar & Dashboard
    adminOverview: "Overview",
    adminProjects: "Projects",
    adminApartments: "Apartments",
    adminDocuments: "Documents",
    adminAppointments: "Appointments",
    adminLeads: "Leads & Chats",
    adminCms: "Landing CMS",
    adminSettings: "Site Settings",
    adminSignOut: "Sign Out",
    adminPanelTitle: "WAFA Admin Panel",
    adminSalesPlatform: "Sales Platform",
    adminTotalRevenue: "Total Reserved Revenue",
    adminPendingAppointments: "Pending Visits",
    adminTotalLeads: "Total Leads",
    adminHotLeads: "Hot Leads (HOT)",
  },

  ar: {
    // Nav & Common
    navApartments: "الشقق",
    navAbout: "من نحن",
    navTestimonials: "آراء العملاء",
    navAiAdvisor: "المستشار الافتراضي",
    exploreBtn: "استكشاف العقارات",
    searchPlaceholder: "البحث عن شقة...",
    clearFilters: "إعادة ضبط",
    reset: "إعادة ضبط",
    all: "الكل",
    available: "متاح",
    reserved: "محجوز",
    sold: "مباع",

    // Specs & Apartment
    askingPrice: "السعر المطلوب",
    surfaceArea: "المساحة",
    bedrooms: "غرف النوم",
    bathrooms: "حمامات",
    orientation: "الاتجاه",
    floorPlan: "مخطط الشقة",
    locationMap: "خريطة الموقع",
    scheduleTour: "حجز موعد زيارة",
    consultAdvisor: "التواصل مع المستشار",
    similarApartments: "عقارات مشابهة",
    features: "المميزات والخدمات",
    balcony: "شرفة",
    parking: "موقف سيارات",
    floor: "الطابق",
    backToCatalog: "العودة إلى الكتالوج",
    description: "وصف العقار",
    priceHt: "دينار تونسي",

    // Filters
    searchFilters: "خيارات البحث",
    minPrice: "السعر الأدنى",
    maxPrice: "السعر الأقصى",
    minSurface: "المساحة الأدنى (م²)",
    maxSurface: "المساحة الأقصى (م²)",
    roomsCount: "عدد الغرف",
    bedroomsCount: "عدد غرف النوم",
    options: "المميزات الإضافية",
    sortBy: "ترتيب حسب",
    newest: "الأحدث",
    priceAsc: "السعر: من الأقل للأعلى",
    priceDesc: "السعر: من الأعلى للأقل",
    surfaceDesc: "المساحة: من الأكبر للأصغر",
    applyFilters: "تطبيق التصفية",

    // Chat
    wafaAdvisor: "مستشار وفاء",
    advisorTitle: "مستشار المبيعات 24/7",
    chatWelcome: "مرحباً بك! أنا المستشار التجاري الافتراضي لإقامة وفاء. كيف يمكنني مساعدتك اليوم؟",
    typeMessage: "اطرح أي سؤال حول إقامة وفاء...",
    send: "إرسال",
    resetChat: "محادثة جديدة",
    online: "متصل الآن",
    draftingReply: "جاري كتابة الرد...",

    // Admin Sidebar & Dashboard
    adminOverview: "نظرة عامة",
    adminProjects: "المشاريع",
    adminApartments: "الشقق",
    adminDocuments: "المستندات",
    adminAppointments: "المواعيد",
    adminLeads: "العملاء المحتملون",
    adminCms: "إدارة المحتوى",
    adminSettings: "إعدادات الموقع",
    adminSignOut: "تسجيل الخروج",
    adminPanelTitle: "إدارة إقامة وفاء",
    adminSalesPlatform: "منصة المبيعات",
    adminTotalRevenue: "إجمالي المحجوزات",
    adminPendingAppointments: "زيارات قيد الانتظار",
    adminTotalLeads: "إجمالي العملاء",
    adminHotLeads: "عملاء مهتمون جداً",
  },
};

export type TranslationKey = keyof typeof translations.fr;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default language is French ("fr")
  const [locale, setLocaleState] = useState<Locale>("fr");

  // Load saved language from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem("elysium_lang") as Locale;
    if (saved && (saved === "en" || saved === "fr" || saved === "ar")) {
      setLocaleState(saved);
    } else {
      setLocaleState("fr"); // French by default
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

  // Sync RTL attributes on mount / change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const html = document.documentElement;
      html.lang = locale;
      if (locale === "ar") {
        html.dir = "rtl";
      } else {
        html.dir = "ltr";
      }
    }
  }, [locale]);

  const t = (key: TranslationKey): string => {
    const currentDict = translations[locale] || translations.fr;
    return currentDict[key] || translations.fr[key] || translations.en[key] || String(key);
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
    return {
      locale: "fr" as Locale,
      setLocale: () => {},
      t: (key: TranslationKey) => translations.fr[key] || String(key),
    };
  }
  return context;
}
