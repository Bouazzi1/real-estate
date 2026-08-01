import { prisma } from "../prisma";
import { getAvailableSlotsForDate } from "../appointments";
import { getEmailProvider } from "../providers/email";

// 1. Tool JSON Schemas for OpenAI compatibility
export const agentTools = [
  {
    type: "function" as const,
    function: {
      name: "search_apartments",
      description: "Query and search the available apartment listings based on filters like budget, surface area, and rooms.",
      parameters: {
        type: "object",
        properties: {
          minPrice: { type: "number", description: "Minimum budget price in TND (DT)" },
          maxPrice: { type: "number", description: "Maximum budget price in TND (DT)" },
          minSurface: { type: "number", description: "Minimum surface area in square meters (m²)" },
          rooms: { type: "integer", description: "Desired number of rooms" },
          bedrooms: { type: "integer", description: "Desired number of bedrooms" },
          balcony: { type: "boolean", description: "Must have a balcony" },
          parking: { type: "boolean", description: "Must have a parking slot" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_apartment_details",
      description: "Retrieve comprehensive specifications, details, and description of a single apartment using its unique reference code (e.g. A-101).",
      parameters: {
        type: "object",
        properties: {
          reference: { type: "string", description: "Unique apartment reference code (e.g. A-101)" },
        },
        required: ["reference"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_documents",
      description: "Fetch downloadable document links (brochures, floor plans, design sheets, price lists) for the project or specific apartments.",
      parameters: {
        type: "object",
        properties: {
          apartmentId: { type: "string", description: "Optional ID of a specific apartment" },
          type: { 
            type: "string", 
            enum: ["BROCHURE", "FLOOR_PLAN", "DESIGN", "PRICE_SHEET", "FAQ", "LEGAL"], 
            description: "Optional document type tag to filter results" 
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_available_slots",
      description: "Retrieve free visit and scheduling tour slots on a given date.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date string to query (YYYY-MM-DD format)" },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_appointment",
      description: "Réserve et enregistre une visite privée pour la Résidence WAFA. IMPORTANT : Vous DEVEZ d'abord demander au client son nom complet, numéro de téléphone et adresse e-mail AVANT d'appeler cette fonction. Ne jamais appeler cette fonction sans ces 3 informations.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nom complet du prospect (OBLIGATOIRE — demander au client avant d'appeler)" },
          phone: { type: "string", description: "Numéro de téléphone du prospect (OBLIGATOIRE — demander au client avant d'appeler)" },
          email: { type: "string", description: "Adresse e-mail du prospect (OBLIGATOIRE — demander au client avant d'appeler)" },
          slot: { type: "string", description: "Date et heure du rendez-vous (ex: 2026-07-30T14:00:00.000Z)" },
          date: { type: "string", description: "Date au format YYYY-MM-DD" },
          time: { type: "string", description: "Heure (ex: 14:00)" },
          type: { type: "string", enum: ["VISIT", "VIDEO_CALL", "OFFICE"], description: "Type de la visite (par défaut VISIT)" },
          apartmentId: { type: "string", description: "Référence (ex: WAF-101) ou ID de l'appartement" },
        },
        required: ["name", "phone", "email"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "escalate_to_human",
      description: "Escalate the conversation to a human sales agent when the client requests human assistance or has complex questions outside RAG listings.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Reason for the human agent escalation" },
          sessionId: { type: "string", description: "Active session ID of the chat conversation" },
        },
        required: ["reason", "sessionId"],
      },
    },
  },
];

function resolveRelativeDate(input?: string, timeStr?: string): Date {
  const now = new Date();
  if (!input || input.trim() === "") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  }

  const directParse = new Date(input);
  if (!isNaN(directParse.getTime()) && directParse.getFullYear() >= 2026) {
    if (timeStr) {
      const match = timeStr.match(/(\d{1,2})[h:]?(\d{2})?/i);
      if (match) {
        directParse.setHours(parseInt(match[1], 10), parseInt(match[2] || "0", 10), 0, 0);
      }
    }
    return directParse;
  }

  const lower = input.toLowerCase().trim();
  const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const targetDayIdx = dayNames.findIndex((day) => lower.includes(day));

  if (targetDayIdx !== -1) {
    const currentDayIdx = now.getDay();
    let diff = targetDayIdx - currentDayIdx;
    if (diff <= 0) diff += 7;

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);

    if (timeStr) {
      const match = timeStr.match(/(\d{1,2})[h:]?(\d{2})?/i);
      if (match) {
        targetDate.setHours(parseInt(match[1], 10), parseInt(match[2] || "0", 10), 0, 0);
      } else {
        targetDate.setHours(10, 0, 0, 0);
      }
    } else {
      targetDate.setHours(10, 0, 0, 0);
    }
    return targetDate;
  }

  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(10, 0, 0, 0);
  return fallback;
}

// 2. Tool Execution routing logic
export async function executeAgentTool(name: string, args: any): Promise<any> {
  console.log(`Executing Agent Tool [${name}] with args:`, args);

  switch (name) {
    case "search_apartments": {
      const apartments = await prisma.apartment.findMany({
        where: {
          price: {
            gte: args.minPrice || undefined,
            lte: args.maxPrice || undefined,
          },
          surface: {
            gte: args.minSurface || undefined,
          },
          rooms: args.rooms || undefined,
          bedrooms: args.bedrooms || undefined,
          balcony: args.balcony !== undefined ? args.balcony : undefined,
          parking: args.parking !== undefined ? args.parking : undefined,
          status: "AVAILABLE",
        },
        select: {
          id: true,
          reference: true,
          title: true,
          price: true,
          surface: true,
          rooms: true,
          bedrooms: true,
          balcony: true,
          parking: true,
          slug: true,
        },
        take: 5,
      });
      return apartments;
    }

    case "get_apartment_details": {
      const apt = await prisma.apartment.findUnique({
        where: { reference: args.reference },
        include: {
          project: {
            select: { name: true },
          },
          documents: {
            select: { id: true, title: true, type: true, fileUrl: true },
          },
        },
      });
      if (!apt) return { error: `Apartment with reference ${args.reference} not found.` };
      return apt;
    }

    case "get_documents": {
      const docs = await prisma.document.findMany({
        where: {
          apartmentId: args.apartmentId,
          type: args.type || undefined,
        },
        select: {
          id: true,
          title: true,
          type: true,
          fileUrl: true,
          sizeBytes: true,
        },
      });
      return docs;
    }

    case "get_available_slots": {
      const targetDate = resolveRelativeDate(args.date);
      const slots = await getAvailableSlotsForDate(targetDate);
      
      // Format slots as human-readable French text for the model to present naturally
      const dayName = targetDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      const formattedSlots = slots.map((s) => {
        const time = s.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        const iso = s.toISOString();
        return `${time} (ISO: ${iso})`;
      });
      
      return {
        date: dayName,
        availableSlots: formattedSlots,
        totalSlots: formattedSlots.length,
        instructions: "Présentez ces créneaux au client de manière élégante et naturelle. Utilisez uniquement le format horaire lisible (ex: 9h00, 14h00). Ne montrez JAMAIS les valeurs ISO au client."
      };
    }

    case "create_appointment": {
      const name = args.name || args.clientName || "";
      const email = args.email || args.clientEmail || "";
      const phone = args.phone || args.clientPhone || "";
      
      // BACKEND GUARD: Reject if contact info is missing — force the model to ask the client
      const missingFields: string[] = [];
      if (!name || name === "Prospect Résidence WAFA" || name.length < 2) missingFields.push("nom complet");
      if (!phone || phone.length < 4) missingFields.push("numéro de téléphone");
      if (!email || !email.includes("@")) missingFields.push("adresse e-mail");
      
      if (missingFields.length > 0) {
        return {
          success: false,
          error: `INFORMATIONS MANQUANTES : Vous devez d'abord demander au client les informations suivantes avant de créer le rendez-vous : ${missingFields.join(", ")}. Veuillez poser la question au client et rappeler cette fonction avec toutes les informations.`,
        };
      }
      
      const aptInput = args.apartmentId || args.apartmentRef || args.reference || null;

      // Smart relative date parsing
      const dateInput = args.slot || args.date || "";
      const timeInput = args.time || args.timeSlot || "";
      const requestedSlot = resolveRelativeDate(dateInput, timeInput);

      // Resolve apartment ID
      let resolvedApartmentId: string | null = null;
      if (aptInput) {
        const aptById = await prisma.apartment.findUnique({
          where: { id: aptInput },
        });
        if (aptById) {
          resolvedApartmentId = aptById.id;
        } else {
          const aptByRef = await prisma.apartment.findFirst({
            where: {
              OR: [
                { reference: { equals: aptInput, mode: "insensitive" } },
                { slug: { equals: aptInput, mode: "insensitive" } },
              ],
            },
          });
          if (aptByRef) {
            resolvedApartmentId = aptByRef.id;
          }
        }
      }

      // Upsert Lead
      let lead = null;
      if (email) {
        lead = await prisma.lead.findFirst({ where: { email } });
      }
      if (!lead && phone) {
        lead = await prisma.lead.findFirst({ where: { phone } });
      }

      const interestedIds = resolvedApartmentId ? [resolvedApartmentId] : [];

      if (!lead) {
        lead = await prisma.lead.create({
          data: {
            name,
            email,
            phone,
            source: "CHAT",
            score: "HOT",
            interestedApartmentIds: interestedIds,
          },
        });
      } else {
        const updatedInterested = Array.from(
          new Set([...(lead.interestedApartmentIds || []), ...interestedIds])
        );
        lead = await prisma.lead.update({
          where: { id: lead.id },
          data: {
            name: name !== "Prospect Résidence WAFA" ? name : lead.name,
            email: email || lead.email,
            phone: phone || lead.phone,
            interestedApartmentIds: updatedInterested,
            score: "HOT",
          },
        });
      }

      // Book Appointment
      const appt = await prisma.appointment.create({
        data: {
          leadId: lead.id,
          apartmentId: resolvedApartmentId,
          requestedSlot,
          type: args.type || "VISIT",
          status: "PENDING",
        },
      });

      // Queue Notification
      await prisma.notification.create({
        data: {
          leadId: lead.id,
          appointmentId: appt.id,
          channel: "EMAIL",
          template: "APPOINTMENT_REQUESTED",
        },
      });

      const formattedDate = requestedSlot.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const formattedTime = requestedSlot.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return {
        success: true,
        message: `Rendez-vous de visite créé et enregistré dans le tableau de bord Admin pour ${name} le ${formattedDate} à ${formattedTime}.`,
        appointmentId: appt.id,
        appointment: appt,
      };
    }

    case "escalate_to_human": {
      const { reason, sessionId } = args;
      
      const conv = await prisma.conversation.findUnique({
        where: { sessionId },
      });

      if (conv) {
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { escalated: true },
        });

        // Query SiteSettings to find agency email
        const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
        const adminEmail = settings?.contactEmail || "admin@realestate.com";

        // Send alert email to admin
        try {
          const emailProvider = getEmailProvider();
          const html = `
            <h3>Escalation Alert: Client wants to speak with a human agent</h3>
            <p><strong>Session ID:</strong> ${sessionId}</p>
            <p><strong>Reason given:</strong> ${reason}</p>
            <p><a href="${process.env.NEXTAUTH_URL}/admin/leads">Click here to view leads and chat log history</a></p>
          `;
          await emailProvider.sendEmail(adminEmail, "ALERT: Chat Escalation Request", html);
        } catch (err) {
          console.error("Escalation email sending failed:", err);
        }

        return {
          success: true,
          message: "I have flagged this conversation for human attention. A sales representative will contact you shortly.",
        };
      }
      return { error: "Active chat conversation not found." };
    }

    default:
      throw new Error(`Tool function ${name} is not registered.`);
  }
}
