import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\RAZER\\.gemini\\antigravity\\brain\\4f43510e-6c02-4264-ad90-8db051274a09";
const OUTPUT_PDF = path.join(ARTIFACT_DIR, "Dossier_Technique_Et_Guide_Commercial_Residence_WAFA.pdf");

function createPdf() {
  console.log("🎨 Generating Clean 5-Page PDF...");

  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
  });

  const writeStream = fs.createWriteStream(OUTPUT_PDF);
  doc.pipe(writeStream);

  const C_DARK_BG = "#0B0F19";
  const C_GOLD = "#C59B27";
  const C_TEXT = "#1E293B";
  const C_MUTED = "#64748B";
  const C_CARD_BG = "#F8FAFC";
  const C_NAVY = "#0F172A";
  const C_BORDER = "#E2E8F0";

  function addHeader(title: string, category: string) {
    doc.fillColor(C_NAVY).fontSize(8).font("Helvetica-Bold").text(category.toUpperCase(), 40, 25);
    doc.fillColor(C_MUTED).fontSize(8).font("Helvetica").text("Residence WAFA -- Dossier Technique", 350, 25, { align: "right" });
    doc.moveTo(40, 36).lineTo(555, 36).lineWidth(0.5).stroke(C_BORDER);

    doc.fillColor(C_NAVY).fontSize(16).font("Helvetica-Bold").text(title, 40, 48);
    doc.moveTo(40, 70).lineTo(120, 70).lineWidth(3).stroke(C_GOLD);
  }

  function addFooter(pageNum: number) {
    doc.fillColor(C_MUTED).fontSize(8).font("Helvetica").text(
      `Page ${pageNum} sur 5 -- Confidentiel promotion immobiliere Residence WAFA`,
      40, 790, { align: "center" }
    );
  }

  // --- PAGE 1 : COUVERTURE ---
  doc.rect(0, 0, 595.28, 841.89).fill(C_DARK_BG);
  doc.rect(20, 20, 555.28, 801.89).lineWidth(1.5).stroke(C_GOLD);

  doc.fillColor(C_GOLD).fontSize(14).font("Helvetica-Bold").text("RESIDENCE WAFA -- LES BERGES DU LAC 2", 50, 160, { align: "center", characterSpacing: 2 });
  doc.fillColor("#FFFFFF").fontSize(26).font("Helvetica-Bold").text("DOSSIER TECHNIQUE &\nGUIDE COMMERCIAL", 50, 210, { align: "center", lineGap: 8 });

  doc.moveTo(180, 300).lineTo(415, 300).lineWidth(2).stroke(C_GOLD);

  doc.fillColor("#94A3B8").fontSize(11).font("Helvetica").text(
    "Guide complet des fonctionnalites Plateforme Client, Agent IA Conseiller 24/7\net Tableau de Bord Administration Commerciale Back-Office",
    50, 330, { align: "center", lineGap: 5 }
  );

  doc.rect(80, 420, 435, 200).fill("#151D2A").stroke(C_GOLD);
  doc.fillColor(C_GOLD).fontSize(12).font("Helvetica-Bold").text("POINTS CLES DU PROJET", 100, 440);

  const coverBullets = [
    "- Design Ultra-Luxe Dual Theme : Mode Clair (Airbnb) & Mode Sombre (Midnight Gold)",
    "- Agent IA Commercial 24/7 : Gemini 3.1 Flash Lite + NVIDIA NIM (Llama 3.1 70B)",
    "- Prise de Rendez-vous Autonome 7j/7 avec controle d'occupation temps reel",
    "- Back-Office Admin Avance : Gestion des Appartements, Appointments & Leads",
    "- Scoring IA des Prospects : Lead HOT, WARM, COLD avec budget et urgence",
    "- RAG Technique : Reponses instantanees basees sur les documents du projet"
  ];

  let yB = 470;
  coverBullets.forEach(b => {
    doc.fillColor("#E2E8F0").fontSize(9.5).font("Helvetica").text(b, 105, yB);
    yB += 22;
  });

  doc.fillColor("#64748B").fontSize(9).font("Helvetica").text(
    "Document confidentiel -- Promotion Immobiliere Residence WAFA Tunis\nVersion 2.0 | Edition Juillet 2026",
    50, 740, { align: "center" }
  );

  // --- PAGE 2 : SECTION 1 & 2 ---
  doc.addPage();
  addHeader("1. Presentation Generale & Architecture", "Section 1 & 2");

  let y = 85;
  doc.fillColor(C_TEXT).fontSize(9.5).font("Helvetica").text(
    "La plateforme web de la Residence WAFA a ete concue pour offrir une experience digitale d'exception aux acquereurs d'appartements haut de gamme aux Berges du Lac 2 (Tunis). Elle combine une vitrine interactive elegante avec un assistant virtuel IA agentique et un dashboard d'administration dedie aux equipes commerciales.",
    40, y, { width: 515, align: "justify", lineGap: 3 }
  );

  y += 55;
  doc.rect(40, y, 515, 130).fill(C_CARD_BG).stroke(C_BORDER);
  doc.fillColor(C_GOLD).fontSize(10.5).font("Helvetica-Bold").text("STACK TECHNIQUE & INFRASTRUCTURE DE POINTE", 55, y + 12);

  const stackItems = [
    ["Framework & Frontend", "Next.js 16 (App Router), TypeScript, TailwindCSS v4, React 19"],
    ["Base de Donnees & ORM", "PostgreSQL (heberge sur Supabase) + Prisma ORM v7 avec types stricts"],
    ["Dual-Theme System", "Mode Clair (Airbnb Luxe) & Mode Sombre (Elysium Midnight Gold)"],
    ["Intelligence Artificielle", "Google Gemini 3.1 Flash Lite (Primaire) + NVIDIA NIM Llama 3.1 70B (Failover)"],
    ["Moteur RAG Vectoriel", "Embeddings Google gemini-embedding-001 pour la recherche documentaire"]
  ];

  let yS = y + 32;
  stackItems.forEach(([label, desc]) => {
    doc.fillColor(C_NAVY).fontSize(8.5).font("Helvetica-Bold").text(label + " :", 60, yS);
    doc.fillColor(C_TEXT).fontSize(8.5).font("Helvetica").text(desc, 180, yS, { width: 360 });
    yS += 18;
  });

  y += 145;
  doc.fillColor(C_NAVY).fontSize(13).font("Helvetica-Bold").text("2. Ecosysteme IA Agentique & Haute Disponibilite", 40, y);
  doc.moveTo(40, y + 18).lineTo(90, y + 18).lineWidth(2).stroke(C_GOLD);
  y += 28;

  doc.fillColor(C_TEXT).fontSize(9.5).font("Helvetica").text(
    "Pour garantir 100% de disponibilite lors des echanges avec les clients sans interruption ni blocage de quota, l'application est dotee d'une architecture a bascule automatique (Failover) :",
    40, y, { width: 515, align: "justify", lineGap: 3 }
  );

  y += 35;
  doc.rect(40, y, 250, 105).fill("#F1F5F9").stroke("#CBD5E1");
  doc.fillColor(C_NAVY).fontSize(9.5).font("Helvetica-Bold").text("LLM Principal : Gemini 3.1 Flash Lite", 50, y + 12);
  doc.fillColor(C_MUTED).fontSize(8).font("Helvetica").text(
    "- Latence ultra-faible (< 900 ms)\n- Traitement des requetes en langage naturel\n- Support multilingue (Francais, Arabe, Anglais)\n- Execution des outils (Reservation, RAG)",
    50, y + 30, { lineGap: 3 }
  );

  doc.rect(305, y, 250, 105).fill("#F1F5F9").stroke("#CBD5E1");
  doc.fillColor(C_NAVY).fontSize(9.5).font("Helvetica-Bold").text("LLM Secours : NVIDIA NIM (Llama 3.1 70B)", 315, y + 12);
  doc.fillColor(C_MUTED).fontSize(8).font("Helvetica").text(
    "- Active en < 1 ms si quota Gemini atteint (429/400)\n- Puissance du modele 70 Milliards de parametres\n- Zero interruption de service pour le prospect\n- Reponses d'une precision commerciale optimale",
    315, y + 30, { lineGap: 3 }
  );

  y += 118;
  doc.fillColor(C_TEXT).fontSize(9).font("Helvetica").text(
    "Resoluteur Temporel Intelligent : L'agent integre un resoluteur dynamique qui convertit automatiquement les expressions relatives (ex: 'ce jeudi a 8h', 'ce samedi', 'demain') en dates ISO exactes de l'annee en cours (2026), evitant toute erreur d'agenda.",
    40, y, { width: 515, align: "justify" }
  );

  addFooter(2);

  // --- PAGE 3 : SECTION 3 - FRONT OFFICE ---
  doc.addPage();
  addHeader("3. Guide des Fonctionnalites Front-Office", "Section 3");

  y = 85;
  const frontFeatures = [
    {
      title: "Design Dual-Theme (Clair & Sombre)",
      desc: "L'utilisateur peut basculer entre le Mode Light (style Airbnb Luxe avec visuels ultra-nets) et le Mode Sombre (Elysium Midnight Gold). Les images d'arriere-plan du Hero Banner s'ajustent automatiquement pour preserver une lisibilite parfaite."
    },
    {
      title: "Catalogue Dynamique d'Appartements & Filtres",
      desc: "Affichage des typologies disponibles (T2, T3, Penthouses) avec tarifs en Dinars Tunisiens (TND / DT), surfaces en m2, etages, vues et amenagements. Filtres en temps reel par prix, superficie et nombre de pieces."
    },
    {
      title: "Fiches Techniques Individuelles (/apartments/[slug])",
      desc: "Page complete dediee a chaque appartement presentant la galerie photos HD, les caracteristiques d'exception, les plans 2D/3D et un bouton direct de reservation de visite privee qui pre-remplit la reference dans le chat."
    },
    {
      title: "Chat Commercial Virtuel 24/7",
      desc: "Disponible via le bouton flottant ou la page dediee /chat. L'agent IA conseille le client, repond aux questions sur les finitions, presente les disponibilites reelles et guide la qualification du besoin."
    },
    {
      title: "Prise de Rendez-vous de Visite Autonome (7j/7)",
      desc: "Module de reservation ouvert 7 jours sur 7 (Semaine 9h-18h / Week-end 10h-17h). L'IA verifie les creneaux libres en base de donnees, collecte les coordonnees du client (Nom, Email, Telephone) et enregistre la visite en instantane."
    },
    {
      title: "Espace Documents & Telechargements",
      desc: "Acces direct aux brochures PDF, cahiers des charges techniques, fiches de prix et plans d'architecte enregistres par le promoteur."
    }
  ];

  frontFeatures.forEach(feat => {
    doc.rect(40, y, 515, 60).fill(C_CARD_BG).stroke(C_BORDER);
    doc.fillColor(C_NAVY).fontSize(10.5).font("Helvetica-Bold").text(feat.title, 55, y + 10);
    doc.fillColor(C_TEXT).fontSize(8.5).font("Helvetica").text(feat.desc, 55, y + 25, { width: 485, lineGap: 2 });
    y += 68;
  });

  addFooter(3);

  // --- PAGE 4 : SECTION 4 - DASHBOARD ADMIN ---
  doc.addPage();
  addHeader("4. Tableau de Bord Administration (/admin)", "Section 4");

  y = 85;
  doc.fillColor(C_TEXT).fontSize(9.5).font("Helvetica").text(
    "Le Back-Office d'Administration (/admin) est l'outil centralise mis a la disposition des equipes commerciales et du promoteur de la Residence WAFA. Il permet de superviser l'activite en temps reel, de gerer les rendez-vous et de qualifier les prospects.",
    40, y, { width: 515, align: "justify", lineGap: 3 }
  );

  y += 40;
  const adminModules = [
    {
      url: "/admin -- Vue d'Ensemble & Analytics",
      details: [
        "Chiffre d'Affaires total reserve et potentiel en Dinars Tunisiens (DT).",
        "Volume de prospects (Leads) enregistres avec repartition par niveau de qualification.",
        "Nombre de visites privees prevues pour la semaine en cours.",
        "Graphiques d'evolution des conversations et taux de conversion commercial."
      ]
    },
    {
      url: "/admin/appointments -- Gestion des Visites Privees",
      details: [
        "Tableau complet de tous les rendez-vous pris par les prospects (via le Chat IA ou le site).",
        "Informations affichees : Nom du prospect, Telephone, Email, Date & Heure du rdv, Appartement vise.",
        "Statuts du rendez-vous : PENDING (En attente), APPROVED (Confirme), CANCELLED (Annule), COMPLETED (Effectue).",
        "Actions rapides en 1 clic : Boutons Approuver, Annuler ou Modifier un rendez-vous."
      ]
    },
    {
      url: "/admin/leads -- Fichier Prospects & Scoring IA",
      details: [
        "Liste complete de tous les prospects ayant interagi avec l'application.",
        "Qualification IA automatique : Attribution d'un score HOT (Fort interet), WARM (Interesse), COLD (Curieux).",
        "Extraction automatique par l'IA : Budget minimum et maximum du client, urgence d'achat.",
        "Consultation de l'historique complet des discussions entre l'IA et le prospect."
      ]
    },
    {
      url: "/admin/apartments -- Gestion du Catalogue & Stock",
      details: [
        "Gestion du stock d'appartements : Ajout de nouveaux biens, modification des caracteristiques.",
        "Mise a jour des prix en Dinars Tunisiens (DT) et des surfaces.",
        "Gestion des statuts en temps reel : AVAILABLE (Disponible), RESERVED (Reserve), SOLD (Vendu).",
        "Televersement de la galerie photos HD et des plans d'architecte."
      ]
    },
    {
      url: "/admin/documents -- RAG & Documents Techniques",
      details: [
        "Televersement et gestion des brochures PDF et cahiers des charges.",
        "Indexation automatique dans le moteur RAG pour nourrir les connaissances de l'Agent IA.",
        "Association des documents aux appartements specifiques."
      ]
    },
    {
      url: "/admin/settings & /admin/cms -- Configuration & CMS",
      details: [
        "Gestion des contenus CMS : Bannieres d'information, temoignages, actualites.",
        "Parametres du standard telephonique et adresse de notification des commerciaux."
      ]
    }
  ];

  adminModules.forEach(mod => {
    doc.rect(40, y, 515, 72).fill("#F8FAFC").stroke(C_BORDER);
    doc.fillColor(C_GOLD).fontSize(10).font("Helvetica-Bold").text(mod.url, 50, y + 8);

    let yD = y + 23;
    mod.details.forEach(d => {
      doc.fillColor(C_TEXT).fontSize(8.2).font("Helvetica").text("- " + d, 55, yD, { width: 490 });
      yD += 11;
    });

    y += 78;
  });

  addFooter(4);

  // --- PAGE 5 : SECTION 5 & 6 - GUIDE COMMERCIAL ---
  doc.addPage();
  addHeader("5. Guide d'Utilisation Commerciale & Prompts", "Section 5 & 6");

  y = 85;
  doc.rect(40, y, 515, 120).fill("#EFF6FF").stroke("#BFDBFE");
  doc.fillColor("#1E40AF").fontSize(10.5).font("Helvetica-Bold").text("PROTOCOLE DE TRAITEMENT DES LEADS CHAUDS (HOT)", 55, y + 12);
  doc.fillColor(C_TEXT).fontSize(8.5).font("Helvetica").text(
    "Lorsqu'un prospect prend rendez-vous via le chat web, un Lead de statut 'HOT' et un Rendez-vous 'PENDING' sont automatiquement me creation dans le Dashboard Admin (/admin/appointments) :\n\n" +
    "1. L'agent commercial ouvre la fiche du rendez-vous dans /admin/appointments.\n" +
    "2. Il prend connaissance du nom, du numero de telephone et de l'appartement souhaite.\n" +
    "3. Il effectue un appel de confirmation sous 2 heures pour valider l'accueil sur site aux Berges du Lac 2.\n" +
    "4. Il clique sur le bouton 'Approuver' dans l'Admin pour passer le statut en 'APPROVED'.",
    55, y + 28, { width: 485, lineGap: 3 }
  );

  y += 135;
  doc.fillColor(C_NAVY).fontSize(13).font("Helvetica-Bold").text("6. Arguments Majeurs a Transmettre au Client", 40, y);
  doc.moveTo(40, y + 18).lineTo(90, y + 18).lineWidth(2).stroke(C_GOLD);
  y += 28;

  const salesArgs = [
    ["Emplacement Strategique", "Les Berges du Lac 2, Tunis -- quartier diplomatique et d'affaires a forte valeur patrimoniale."],
    ["Architecture & Luminosite", "Grandes baies vitrees toute hauteur, terrasses panoramiques privatives avec vues degagees."],
    ["Materiaux Nobles & Finitions", "Revetement en marbre noble, parquet dans les chambres, douches a l'italienne."],
    ["Domotique & Confort", "Climatisation centrale reversible, volets roulants motorises, eclairage d'ambiance scenarise."],
    ["Securite & Conciergerie", "Residence fermee gardee 24/7 avec controle d'acces numerique, parking sous-sol securise."]
  ];

  salesArgs.forEach(([title, desc]) => {
    doc.rect(40, y, 515, 42).fill(C_CARD_BG).stroke(C_BORDER);
    doc.fillColor(C_GOLD).fontSize(9).font("Helvetica-Bold").text(title, 55, y + 8);
    doc.fillColor(C_TEXT).fontSize(8.2).font("Helvetica").text(desc, 55, y + 21, { width: 485 });
    y += 48;
  });

  addFooter(5);

  doc.end();

  writeStream.on("finish", () => {
    console.log("✅ PERFECT 5-Page PDF generated successfully at:", OUTPUT_PDF);
  });
}

createPdf();
