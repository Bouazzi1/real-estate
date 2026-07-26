import type { Metadata } from "next";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import AuthProvider from "@/components/providers/SessionProvider";
import ChatWidget from "@/components/chat/ChatWidget";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import React from "react";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
    return {
      title: settings?.seoTitle || "Premium Properties | Elysium Residences",
      description: settings?.seoDescription || "Explore luxury apartments and schedule direct tours.",
    };
  } catch (e) {
    return {
      title: "Premium Properties | Elysium Residences",
      description: "Explore luxury apartments and schedule direct tours.",
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings = null;
  try {
    settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
  } catch (e) {
    console.error("Failed to load SiteSettings in root layout:", e);
  }

  const primaryColor = settings?.primaryColor || "#0f172a";
  const secondaryColor = settings?.secondaryColor || "#3b82f6";
  const fontFamily = settings?.fontFamily || "Inter";

  // Format font name for Google Fonts url import (e.g. "Plus Jakarta Sans" -> "Plus+Jakarta+Sans")
  const googleFontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, "+")}:wght@300;400;500;600;700;800&display=swap`;

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={googleFontUrl} rel="stylesheet" />
        
        {/* Dynamic theme style injection */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary-color: ${primaryColor};
                --secondary-color: ${secondaryColor};
                --font-family: '${fontFamily}', sans-serif;
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <LanguageProvider>
            {children}
            <ChatWidget />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
