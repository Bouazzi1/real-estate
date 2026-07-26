import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

function generateCompletePDF() {
  console.log("📄 Generating FULL PDF Technical Dossier for Résidence Aurea...");

  const doc = new PDFDocument({
    margin: 50,
    size: "A4",
    bufferPages: true,
    info: {
      Title: "Dossier Technique & Architecture Système — Résidence Aurea",
      Author: "Équipe d'Ingénierie Résidence Aurea",
      Subject: "Spécifications Techniques, React 18, Hooks, RAG IA Nemotron-3 2048D, pgvector, Docker",
    },
  });

  const pdfPath = path.join(process.cwd(), "dossier_technique_residence_aurea.pdf");
  const brainPdfPath = "C:\\Users\\RAZER\\.gemini\\antigravity\\brain\\4f43510e-6c02-4264-ad90-8db051274a09\\dossier_technique_residence_aurea.pdf";

  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // Palette
  const primaryColor = "#0f172a"; // Slate 900
  const accentGold = "#d97706";   // Amber 600
  const textColor = "#334155";    // Slate 700
  const headingColor = "#0f172a"; // Slate 900
  const bgBox = "#f8fafc";        // Slate 50
  const codeBg = "#1e293b";       // Slate 800

  // Header Banner on Page 1
  doc.rect(0, 0, doc.page.width, 130).fill(primaryColor);

  doc
    .fillColor("#ffffff")
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("RÉSIDENCE AUREA", 50, 35, { characterSpacing: 1.5 });

  doc
    .fillColor(accentGold)
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("DOSSIER TECHNIQUE & ARCHITECTURE SYSTÈME", 50, 65);

  doc
    .fillColor("#94a3b8")
    .fontSize(9)
    .font("Helvetica")
    .text("Plateforme Web Immobilière & Conseiller Comercial IA (RAG Nemotron-3 2048D / Llama 3.1 70B)", 50, 88);

  doc
    .fillColor("#cbd5e1")
    .fontSize(8)
    .font("Helvetica-Oblique")
    .text("Document récapitulatif à destination de l'équipe technique et commerciale", 50, 104);

  doc.y = 150;

  // Helper for Section Headers
  const sectionHeader = (title: string) => {
    if (doc.y > doc.page.height - 120) doc.addPage();
    doc.moveDown(0.8);
    const y = doc.y;
    doc.rect(50, y, 4, 18).fill(accentGold);
    doc
      .fillColor(headingColor)
      .fontSize(13)
      .font("Helvetica-Bold")
      .text(title, 62, y + 2);
    doc.moveDown(0.6);
  };

  // Helper for Sub-Headers
  const subHeader = (title: string) => {
    if (doc.y > doc.page.height - 100) doc.addPage();
    doc.moveDown(0.4);
    doc
      .fillColor(accentGold)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(title, 50);
    doc.moveDown(0.3);
  };

  // Helper for Bullets
  const bullet = (label: string, value: string) => {
    if (doc.y > doc.page.height - 80) doc.addPage();
    doc
      .fillColor(headingColor)
      .fontSize(9.5)
      .font("Helvetica-Bold")
      .text(`• ${label} : `, 55, doc.y, { continued: true });
    doc
      .fillColor(textColor)
      .font("Helvetica")
      .text(value, { lineGap: 2 });
    doc.moveDown(0.25);
  };

  // Helper for Sub-bullets
  const subBullet = (label: string, text: string) => {
    if (doc.y > doc.page.height - 70) doc.addPage();
    doc
      .fillColor(headingColor)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(`    - ${label} : `, 65, doc.y, { continued: true });
    doc
      .fillColor(textColor)
      .font("Helvetica")
      .text(text, { lineGap: 2 });
    doc.moveDown(0.2);
  };

  // Helper for Code Blocks
  const codeBlock = (codeLines: string[]) => {
    if (doc.y > doc.page.height - 120) doc.addPage();
    doc.moveDown(0.3);
    const height = codeLines.length * 14 + 12;
    const y = doc.y;
    doc.rect(55, y, doc.page.width - 110, height).fill(codeBg);

    let currY = y + 6;
    codeLines.forEach((line) => {
      doc
        .fillColor("#38bdf8")
        .fontSize(8.5)
        .font("Courier")
        .text(line, 65, currY);
      currY += 14;
    });
    doc.y = y + height + 6;
  };

  // --- 1. VUE D'ENSEMBLE ---
  sectionHeader("1. VUE D'ENSEMBLE DE L'ARCHITECTURE");
  doc
    .fillColor(textColor)
    .fontSize(9.5)
    .font("Helvetica")
    .text(
      "La plateforme Résidence Aurea est une application web moderne 'phygitale' combinant la présentation de biens immobiliers de luxe et un conseiller commercial virtuel IA disponible 24/7. Elle permet d'attirer, de qualifier et de convertir automatiquement les visiteurs en rendez-vous de visite privée.",
      { align: "justify", lineGap: 3 }
    );

  doc.moveDown(0.5);

  // Flow Box
  if (doc.y > doc.page.height - 150) doc.addPage();
  const flowY = doc.y;
  doc.rect(50, flowY, doc.page.width - 100, 95).fill(bgBox).stroke("#cbd5e1");
  doc
    .fillColor(headingColor)
    .fontSize(9.5)
    .font("Helvetica-Bold")
    .text("Flux de Traitement IA & RAG (Architecture Réseau) :", 60, flowY + 8);

  doc
    .fillColor(textColor)
    .fontSize(8.5)
    .font("Helvetica")
    .text("1. Visiteur Client  →  Navigation & Chat Stream SSE (/api/chat)", 65, flowY + 24)
    .text("2. Moteur d'Embedding  →  NVIDIA Nemotron-3-Embed-1B (Calcul du vecteur 2048D)", 65, flowY + 38)
    .text("3. Base Vectorielle  →  PostgreSQL + pgvector (Recherche par Cosinus, Top 3 Chunks)", 65, flowY + 52)
    .text("4. Génération LLM  →  NVIDIA NIM Llama 3.1 70B Instruct (Outillage Function Calling & Stream)", 65, flowY + 66)
    .text("5. CRM & Qualification  →  Qualification asynchrone des Leads (HOT / WARM / COLD) en TND", 65, flowY + 80);

  doc.y = flowY + 105;

  // --- 2. STACK TECHNOLOGIQUE ---
  sectionHeader("2. STACK TECHNOLOGIQUE (TECHNOLOGIES UTILISÉES)");

  subHeader("A. Frontend (Interface Utilisateur)");
  bullet("Framework", "Next.js 14+ (App Router, Server Components & Client Components).");
  bullet("Bibliothèque UI", "React 18 (Architecture réactive moderne).");

  doc.fillColor(headingColor).fontSize(9.5).font("Helvetica-Bold").text("Utilisation des Hooks React :", 60);
  doc.moveDown(0.2);
  subBullet("useState & useReducer", "Gestion de l'état réactif local et global (filtres du catalogue, formulaires, flux de chat, modales Admin).");
  subBullet("useEffect", "Synchronisation des effets de bord (chargement de la session localStorage, pré-qualification, auto-scroll).");
  subBullet("useRef", "Manipulation directe du DOM (défilement automatique du fil de discussion de l'agent IA, conteneurs de carte Leaflet).");
  subBullet("useSearchParams & usePathname", "Synchronisation en temps réel des filtres de recherche et des intentions de réservation avec l'URL.");
  subBullet("useContext", "Diffusion globale de la langue (i18n) et de l'orientation d'affichage (LTR/RTL).");

  bullet("Langage", "TypeScript (Typage strict de bout en bout).");
  bullet("Styles & Design System", "Tailwind CSS + effets de Glassmorphism UI (Slate sombre #0f172a & Accents Dorés #d97706).");
  bullet("Icônes & Visuels", "Lucide React & Génération d'artefacts visuels immobiliers haute résolution.");
  bullet("Cartographie", "Leaflet / OpenStreetMap (Intégration dynamique des coordonnées GPS des projets).");
  bullet("Internationalisation (i18n)", "Prise en charge multilingue (Français, Anglais, Arabe avec basculement automatique du layout en RTL dir='rtl').");

  subHeader("B. Backend & API Infrastructure");
  bullet("Runtime", "Node.js runtime unifié avec Next.js App Router.");
  bullet("Streaming d'IA", "Server-Sent Events (SSE) via ReadableStream pour l'affichage fluide et progressif des réponses du conseiller virtuel.");
  bullet("Authentification Sécurisée", "NextAuth (Provider Credentials pour l'Espace Administrateur).");
  bullet("CMS Visual Customizer", "Éditeur dynamique avec panneau de prévisualisation en temps réel via iframe et événements postMessage.");

  subHeader("C. Moteur d'Intelligence Artificielle & RAG");
  bullet("Modèle d'Embedding", "nvidia/nemotron-3-embed-1b via l'infrastructure NVIDIA NIM (Modèle 1B paramètres produisant des vecteurs de 2048 dimensions).");
  bullet("Modèle de Langage (LLM)", "meta/llama-3.1-70b-instruct via l'API OpenAI-compatible NVIDIA NIM.");
  bullet("Moteur RAG Vectoriel", "Recherche par similarité cosinus directement en SQL natif via l'extension PostgreSQL pgvector (1 - (embedding <=> query::vector)).");
  bullet("Optimisation de Latence", "Détection automatique des salutations (réponse instantanée < 150 ms) et sélection du Top 3 des fragments pertinents.");
  bullet("Suite d'Outils Agent (Function Calling)", "search_apartments, get_apartment_details, get_documents, get_available_slots, create_appointment, escalate_to_human.");

  subHeader("D. Base de Données & Persistance");
  bullet("SGBD", "PostgreSQL (Version 15+).");
  bullet("Extension Vectorielle", "pgvector (prise en charge des index vectoriels 2048 dimensions).");
  bullet("ORM", "Prisma 7 (@prisma/client avec adaptateur de pool natif @prisma/adapter-pg).");
  bullet("Devise Principale", "Dinar Tunisien (TND / DT) appliqué sur l'ensemble du catalogue, du simulateur de prêt et de l'agent IA.");

  subHeader("E. Notifications & E-Mails");
  bullet("Générateur iCalendar (.ics)", "Formatage UTC automatique pour l'envoi de fichiers d'invitation de rendez-vous dans les agendas clients (Google Calendar, Outlook, Apple Calendar).");
  bullet("Fournisseur E-mail", "Provider générique (Resend / SMTP).");

  // --- 3. MODÈLES DE DONNÉES ---
  sectionHeader("3. SCHÉMA DES DONNÉES (MODÈLES PRISMA PRINCIPATION)");
  bullet("Project", "Programme immobilier (Nom, localisation GPS, photos, statut).");
  bullet("Apartment", "Appartements et attiques (Référence, prix en TND, surface m², pièces, orientation, étage, statut).");
  bullet("Document & DocumentChunk", "Brochures PDF, plans 3D et leurs vecteurs d'indexation 2048D.");
  bullet("Lead", "Prospects qualifiés (Nom, email, téléphone, score HOT/WARM/COLD, budget min/max, urgence).");
  bullet("Conversation & Message", "Historique des échanges entre le client et l'agent IA.");
  bullet("Appointment", "Rendez-vous de visites planifiés (Créneau ISO, type de visite, statut d'approbation).");
  bullet("CmsSection & SiteSettings", "Réglages graphiques, polices, couleurs et contenus dynamiques de la landing page.");

  // --- 4. INSTALLATION & DÉPLOIEMENT ---
  sectionHeader("4. PROCÉDURE D'INSTALLATION & DÉPLOIEMENT");
  doc.fillColor(headingColor).fontSize(9.5).font("Helvetica-Bold").text("Prérequis système : Node.js 18+, Docker & Docker Compose, Clé API NVIDIA NIM.");
  doc.moveDown(0.3);

  subHeader("Étape 1 : Lancement de la Base de Données PostgreSQL (Docker)");
  codeBlock(["docker compose up -d"]);

  subHeader("Étape 2 : Synchronisation du Schéma & Seed Initial");
  codeBlock(["npx prisma db push", "npx tsx prisma/seed.ts"]);

  subHeader("Étape 3 : Réindexation Vectorielle RAG (Nemotron-3 2048D)");
  codeBlock(["npx tsx scripts/reindex-all.ts"]);

  subHeader("Étape 4 : Lancement du Serveur de Développement");
  codeBlock(["npm run dev", "# Accès à l'application sur http://localhost:3001"]);

  // --- 5. DÉPLOIEMENT PRODUCTION DOCKER ---
  sectionHeader("5. DÉPLOIEMENT EN PRODUCTION (CONTAINER DOCKER)");
  doc
    .fillColor(textColor)
    .fontSize(9.5)
    .font("Helvetica")
    .text(
      "Un fichier Dockerfile multi-étapes (multi-stage) optimisé est fourni à la racine du projet pour la mise en production :",
      { lineGap: 3 }
    );
  doc.moveDown(0.3);
  bullet("Étape 1 - deps", "Installation des dépendances de production.");
  bullet("Étape 2 - builder", "Génération du client Prisma et compilation Next.js optimisée (output: 'standalone').");
  bullet("Étape 3 - runner", "Image Alpine Linux ultra-légère exécutant le serveur de production autonome server.js.");

  // Page numbering on all generated pages
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);

    // Skip footer line over the main header banner on page 1
    doc
      .rect(50, doc.page.height - 35, doc.page.width - 100, 0.5)
      .fill("#cbd5e1");

    doc
      .fillColor("#64748b")
      .fontSize(8)
      .font("Helvetica")
      .text("Résidence Aurea — Dossier Technique & Architecture Système Officiel", 50, doc.page.height - 25);

    doc
      .fillColor("#64748b")
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(`Page ${i + 1} sur ${totalPages}`, doc.page.width - 110, doc.page.height - 25, { align: "right" });
  }

  doc.end();

  stream.on("finish", () => {
    fs.copyFileSync(pdfPath, brainPdfPath);
    console.log(`✅ FULL PDF Dossier generated successfully at: ${pdfPath}`);
    console.log(`✅ Artifact PDF synced at: ${brainPdfPath}`);
  });
}

generateCompletePDF();
