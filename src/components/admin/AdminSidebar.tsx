"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building,
  Building2,
  FileText,
  Calendar,
  Users,
  Settings,
  Edit,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Globe
} from "lucide-react";
import { useTranslation, Locale } from "@/components/providers/LanguageProvider";

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  userAvatar: string;
}

export default function AdminSidebar({ userName, userEmail, userAvatar }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { locale, setLocale, t } = useTranslation();

  const menuItems = [
    { name: t("adminOverview"), href: "/admin", icon: LayoutDashboard },
    { name: t("adminProjects"), href: "/admin/projects", icon: Building },
    { name: t("adminApartments"), href: "/admin/apartments", icon: Building2 },
    { name: t("adminDocuments"), href: "/admin/documents", icon: FileText },
    { name: t("adminAppointments"), href: "/admin/appointments", icon: Calendar },
    { name: t("adminLeads"), href: "/admin/leads", icon: Users },
    { name: t("adminCms"), href: "/admin/cms", icon: Edit },
    { name: t("adminSettings"), href: "/admin/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Header Toggle Bar */}
      <div className="lg:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-6 py-4 text-slate-100">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-amber-500" />
          <span className="font-bold tracking-tight text-white">{t("adminPanelTitle")}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocale(locale === "fr" ? "en" : locale === "en" ? "ar" : "fr")}
            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-amber-400 uppercase"
          >
            {locale}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Layout */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between transform transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:h-screen`}
      >
        {/* Upper Sidebar branding & navigation */}
        <div>
          {/* Logo Brand Header */}
          <div className="px-6 py-6 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white tracking-tight leading-none block">{t("adminPanelTitle")}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1 block">{t("adminSalesPlatform")}</span>
              </div>
            </div>

            {/* Language Switcher Button in Admin Sidebar */}
            <div className="relative group">
              <button
                onClick={() => setLocale(locale === "fr" ? "en" : locale === "en" ? "ar" : "fr")}
                title="Changer de langue / Change Language"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-[10px] font-extrabold uppercase text-amber-400 transition-colors cursor-pointer"
              >
                <Globe className="w-3 h-3 text-amber-400" />
                <span>{locale}</span>
              </button>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="px-4 py-6 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? "text-slate-950" : "text-slate-400 group-hover:text-slate-200"}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-slate-950" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Lower Sidebar Admin Profiler & Logout */}
        <div className="p-4 border-t border-slate-800/60 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <img
              src={userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80"}
              alt={userName}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-800"
            />
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-white truncate leading-tight">{userName}</h4>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900/60 hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-sm font-semibold rounded-xl border border-slate-800/80 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t("adminSignOut")}</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
        />
      )}
    </>
  );
}
