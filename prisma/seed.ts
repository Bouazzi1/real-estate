import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database for Résidence WAFA...");

  // 1. Seed Initial Admin User
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL || "admin@realestate.com";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "admin123";
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Directeur Commercial WAFA",
        role: "ADMIN",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
      }
    });
    console.log(`Created admin account: ${adminEmail}`);
  }

  // 2. Seed Site Settings (Singleton) — Résidence WAFA
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {
      agencyName: "Résidence WAFA",
      logoUrl: "/uploads/folla-logo.png",
      primaryColor: "#0f172a", // Dark luxury slate
      secondaryColor: "#d97706", // Amber gold accent
      fontFamily: "Inter",
      contactEmail: "contact@residence-wafa.tn",
      contactPhone: "+216 71 123 456",
      socialLinks: {
        instagram: "https://instagram.com/residence.wafa",
        linkedin: "https://linkedin.com/company/residence-wafa"
      },
      seoTitle: "Résidence WAFA | Immobilier d'Exception & Suites Penthouses",
      seoDescription: "Découvrez la Résidence WAFA, un programme immobilier d'exception alliant architecture contemporaine et services de conciergerie haut de gamme. Échangez avec notre conseiller IA.",
      ogImage: "/uploads/aurea-exterior.png",
      languages: ["fr", "en", "ar"]
    },
    create: {
      id: "singleton",
      agencyName: "Résidence WAFA",
      logoUrl: "/uploads/folla-logo.png",
      primaryColor: "#0f172a",
      secondaryColor: "#d97706",
      fontFamily: "Inter",
      contactEmail: "contact@residence-wafa.tn",
      contactPhone: "+216 71 123 456",
      socialLinks: {
        instagram: "https://instagram.com/residence.wafa",
        linkedin: "https://linkedin.com/company/residence-wafa"
      },
      seoTitle: "Résidence WAFA | Immobilier d'Exception & Suites Penthouses",
      seoDescription: "Découvrez la Résidence WAFA, un programme immobilier d'exception alliant architecture contemporaine et services de conciergerie haut de gamme. Échangez avec notre conseiller IA.",
      ogImage: "/uploads/aurea-exterior.png",
      languages: ["fr", "en", "ar"]
    }
  });
  console.log("Updated SiteSettings for Résidence WAFA.");

  // 3. Seed CMS Sections — Positionnement Premium Résidence WAFA
  const sections = [
    {
      key: "HERO",
      order: 1,
      enabled: true,
      content: {
        headline: "L'Élégance Absolue au Cœur de la Ville",
        subheadline: "La Résidence WAFA réinvente le luxe résidentiel avec des appartements baignés de lumière, des terrasses panoramiques et un conseiller commercial IA disponible 24/7.",
        backgroundUrl: "/uploads/aurea-exterior.png",
        primaryCta: { text: "Découvrir la Résidence WAFA", link: "/catalog" },
        secondaryCta: { text: "Consulter l'Agent IA", link: "#chat" },
        overlayOpacity: 0.55
      }
    },
    {
      key: "STATS",
      order: 2,
      enabled: true,
      content: {
        items: [
          { number: 24, label: "Suites & Attiques d'Exception", suffix: "" },
          { number: 100, label: "Matériaux Éco-Responsables", suffix: "%" },
          { number: 360, label: "Vues Panoramiques", suffix: "°" }
        ]
      }
    },
    {
      key: "FEATURED",
      order: 3,
      enabled: true,
      content: {
        title: "Nos Typologies d'Exception",
        subtitle: "Des espaces conçus par des architectes de renom pour un art de vivre incomparable.",
        limit: 3
      }
    },
    {
      key: "ABOUT",
      order: 4,
      enabled: true,
      content: {
        title: "Un Art de Vivre Rare & Prestigieux",
        description: "Située dans un quartier hautement prisé, la Résidence WAFA combine lignes architecturales épurées, finitions en marbre et bois précieux, domotique de pointe et service de conciergerie privée.",
        imageUrl: "/uploads/aurea-interior.png",
        features: [
          { icon: "ShieldCheck", title: "Sécurité Renforcée & Conciergerie 24/7" },
          { icon: "Sparkles", title: "Certification Environnementale Haute Performance" },
          { icon: "MapPin", title: "Emplacement d'Exception & Vues Dégagées" }
        ]
      }
    },
    {
      key: "TESTIMONIALS",
      order: 5,
      enabled: true,
      content: {
        title: "L'Avis de nos Premiers Acquéreurs",
        items: [
          {
            name: "Hélène de Saint-Germain",
            photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
            text: "Un accompagnement irréprochable. L'agent IA m'a fourni instantanément la plaquette commerciale et le plan du Penthouse Duplex avant mon rendez-vous sur place.",
            rating: 5
          },
          {
            name: "Alexandre Vaneau",
            photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
            text: "Résidence WAFA offre un niveau de prestations inédit. L'expérience de réservation fluide et la réactivité de l'équipe ont fait toute la différence.",
            rating: 5
          }
        ]
      }
    },
    {
      key: "CTA",
      order: 6,
      enabled: true,
      content: {
        title: "Inscrivez-vous pour une Visite Privée",
        description: "Échangez en direct avec notre conseiller virtuel ou planifiez un rendez-vous personnalisé avec notre équipe commerciale.",
        buttonText: "Explorer le Catalogue",
        buttonLink: "/catalog"
      }
    },
    {
      key: "FOOTER",
      order: 7,
      enabled: true,
      content: {
        columns: [
          {
            title: "Résidence WAFA",
            links: [
              { label: "Catalogue des Appartements", url: "/catalog" },
              { label: "Conseiller Virtuel IA", url: "/chat" }
            ]
          },
          {
            title: "Informations Légales",
            links: [
              { label: "Politique de Confidentialité (RGPD)", url: "/privacy" },
              { label: "Conditions Générales", url: "/terms" }
            ]
          }
        ],
        copyright: "© 2026 Résidence WAFA. Tous droits réservés."
      }
    }
  ];

  await prisma.cmsSection.deleteMany();
  for (const section of sections) {
    await prisma.cmsSection.create({
      data: section
    });
  }
  console.log("Updated CMS Sections for Résidence WAFA.");

  // 4. Seed Project "Résidence WAFA" & Luxury Units
  let project = await prisma.project.findFirst({
    where: { slug: "residence-wafa" }
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "Résidence WAFA",
        slug: "residence-wafa",
        description: "Le nouveau fleuron de l'architecture résidentielle haut de gamme. Penthouses d'exception, terrasses plein ciel et finitions luxueuses.",
        location: {
          lat: 36.8400,
          lng: 10.2800,
          address: "Les Berges du Lac 2, Tunis"
        },
        coverImage: "/uploads/aurea-exterior.png",
        gallery: [
          "/uploads/aurea-exterior.png",
          "/uploads/aurea-interior.png"
        ],
        status: "ACTIVE"
      }
    });
    console.log(`Created main project: ${project.name}`);
  }

  // Seed / update luxury apartments for Résidence WAFA
  const apartmentsData = [
    {
      projectId: project.id,
      reference: "WAF-101",
      title: "L'Atelier WAFA — Studio Prestige",
      slug: "latelier-wafa-studio-prestige-waf101",
      description: "Studio d'exception de 48 m² idéalement agencé avec cuisine en marbre sur mesure, baie vitrée toute hauteur et balcon privé.",
      price: 380000,
      currency: "TND",
      surface: 48.5,
      rooms: 2,
      bedrooms: 1,
      bathrooms: 1,
      floor: 3,
      orientation: "Sud-Ouest",
      balcony: true,
      parking: true,
      status: "AVAILABLE",
      featured: true,
      gallery: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&h=600&q=80",
        "/uploads/aurea-interior.png"
      ],
      floorPlanUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&h=600&q=80"
    },
    {
      projectId: project.id,
      reference: "WAF-302",
      title: "La Suite Panoramique — T3 WAFA",
      slug: "la-suite-panoramique-t3-wafa-waf302",
      description: "Superbe suite de 95 m² avec 2 chambres master, double séjour baigné de lumière naturelle, dressing privatif et grande terrasse de 18 m².",
      price: 790000,
      currency: "TND",
      surface: 95.0,
      rooms: 4,
      bedrooms: 2,
      bathrooms: 2,
      floor: 6,
      orientation: "Sud",
      balcony: true,
      parking: true,
      status: "AVAILABLE",
      featured: true,
      gallery: [
        "/uploads/aurea-interior.png",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&h=600&q=80"
      ],
      floorPlanUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&h=600&q=80"
    },
    {
      projectId: project.id,
      reference: "WAF-801",
      title: "Le Penthouse WAFA Duplex — Attique d'Exception",
      slug: "le-penthouse-wafa-duplex-attique-dexception-waf801",
      description: "Somptueux Penthouse Duplex en attique de 220 m² offrant des plafonds cathédrale, 4 suites privatives, une vaste terrasse avec jacuzzi chauffé et des vues imprenables.",
      price: 1850000,
      currency: "TND",
      surface: 220.0,
      rooms: 6,
      bedrooms: 4,
      bathrooms: 4.5,
      floor: 8,
      orientation: "Plein Sud",
      balcony: true,
      parking: true,
      status: "AVAILABLE",
      featured: true,
      gallery: [
        "/uploads/aurea-interior.png",
        "/uploads/aurea-exterior.png"
      ],
      floorPlanUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&h=600&q=80"
    }
  ];

  for (const apt of apartmentsData) {
    await prisma.apartment.upsert({
      where: { reference: apt.reference },
      update: apt,
      create: apt
    });
  }
  console.log("Created apartments.");

  // 5. Seed Sample Leads & Conversations
  const existingLeads = await prisma.lead.findMany();
  if (existingLeads.length === 0) {
    const lead1 = await prisma.lead.create({
      data: {
        name: "Hélène de Saint-Germain",
        email: "helene.sg@example.com",
        phone: "+216 20 123 456",
        source: "CHAT",
        score: "HOT",
        budgetMin: 1500000,
        budgetMax: 2000000,
        urgency: "IMMEDIATE",
        financingNeeded: false,
        interestedApartmentIds: [],
        conversations: {
          create: {
            sessionId: "sample_session_helene",
            startedAt: new Date(),
            messages: {
              create: [
                { role: "USER", content: "Bonjour, je suis intéressée par le Penthouse WAFA Duplex." },
                { role: "ASSISTANT", content: "Bonjour Hélène ! Le Penthouse Duplex WAF-801 offre 220 m² en attique au prix de 1 850 000 DT." },
                { role: "USER", content: "Super ! Je souhaite réserver une visite privée dès ce jeudi." },
                { role: "ASSISTANT", content: "Parfait ! Votre demande de visite privée pour le jeudi à 14h00 a été soumise avec succès." }
              ]
            }
          }
        }
      }
    });

    const lead2 = await prisma.lead.create({
      data: {
        name: "Alexandre Vaneau",
        email: "alexandre.vaneau@example.com",
        phone: "+216 22 987 654",
        source: "FORM",
        score: "WARM",
        budgetMin: 700000,
        budgetMax: 900000,
        urgency: "3_MONTHS",
        financingNeeded: true,
        interestedApartmentIds: [],
        conversations: {
          create: {
            sessionId: "sample_session_alexandre",
            startedAt: new Date(),
            messages: {
              create: [
                { role: "USER", content: "Bonjour, avez-vous des T3 disponibles avec terrasse ?" },
                { role: "ASSISTANT", content: "Bonjour Alexandre ! Nous proposons La Suite Panoramique (Ref: WAF-302), un T3 de 95 m² avec terrasse de 18 m² au prix de 790 000 DT." }
              ]
            }
          }
        }
      }
    });

    console.log("Created sample leads for Résidence WAFA.");
  }

  console.log("Seeding for Résidence WAFA completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
