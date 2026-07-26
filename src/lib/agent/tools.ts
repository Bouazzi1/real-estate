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
      description: "Fetch downloadable document links (brochures, floor plans, design sheets) for a specific apartment.",
      parameters: {
        type: "object",
        properties: {
          apartmentId: { type: "string", description: "The ID of the target apartment" },
          type: { 
            type: "string", 
            enum: ["BROCHURE", "FLOOR_PLAN", "DESIGN", "PRICE_SHEET", "FAQ", "LEGAL"], 
            description: "Optional document type tag to filter results" 
          },
        },
        required: ["apartmentId"],
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
      description: "Book and reserve a viewing slot. This is a low-friction action. Propose slots FIRST using get_available_slots before creating the appointment.",
      parameters: {
        type: "object",
        properties: {
          slot: { type: "string", description: "Target ISO date-time slot string (e.g. 2026-07-16T10:00:00.000Z)" },
          type: { type: "string", enum: ["VISIT", "VIDEO_CALL", "OFFICE"], description: "Type of the visit" },
          name: { type: "string", description: "Client full name" },
          email: { type: "string", description: "Client email address" },
          phone: { type: "string", description: "Client phone number" },
          apartmentId: { type: "string", description: "Optional apartment ID or reference code (e.g. AUR-302 or A-101) that client is interested in" },
        },
        required: ["slot", "type", "name"],
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
      const date = new Date(args.date);
      if (isNaN(date.getTime())) return { error: "Invalid date format" };
      const slots = await getAvailableSlotsForDate(date);
      return slots.map((s) => s.toISOString());
    }

    case "create_appointment": {
      const requestedSlot = new Date(args.slot);
      if (isNaN(requestedSlot.getTime())) return { error: "Invalid slot date format" };

      // Validate email/phone
      if (!args.email && !args.phone) {
        return { error: "Please provide either your email or phone number so we can register the visit." };
      }

      // Resolve apartment ID by UUID, reference code (e.g. AUR-302), or slug
      let resolvedApartmentId: string | null = null;
      if (args.apartmentId) {
        const aptById = await prisma.apartment.findUnique({
          where: { id: args.apartmentId },
        });
        if (aptById) {
          resolvedApartmentId = aptById.id;
        } else {
          const aptByRef = await prisma.apartment.findFirst({
            where: {
              OR: [
                { reference: { equals: args.apartmentId, mode: "insensitive" } },
                { slug: { equals: args.apartmentId, mode: "insensitive" } },
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
      if (args.email) {
        lead = await prisma.lead.findFirst({ where: { email: args.email } });
      }
      if (!lead && args.phone) {
        lead = await prisma.lead.findFirst({ where: { phone: args.phone } });
      }

      const interestedIds = resolvedApartmentId ? [resolvedApartmentId] : [];

      if (!lead) {
        lead = await prisma.lead.create({
          data: {
            name: args.name,
            email: args.email || null,
            phone: args.phone || null,
            source: "CHAT",
            score: "WARM",
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
            name: args.name,
            interestedApartmentIds: updatedInterested,
            score: "WARM",
          },
        });
      }

      // Conflict check
      const conflict = await prisma.appointment.findFirst({
        where: { status: "APPROVED", requestedSlot },
      });
      if (conflict) {
        return { error: "This slot is no longer available. Please choose a different hour." };
      }

      // Book
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

      // Send Request Email
      try {
        const emailProvider = getEmailProvider();
        const html = `
          <h3>Viewing Appointment Scheduled</h3>
          <p>Dear ${lead.name},</p>
          <p>Your request for a property viewing on <strong>${requestedSlot.toLocaleString()}</strong> has been submitted.</p>
          <p>We will confirm this slot shortly.</p>
        `;
        if (lead.email) {
          await emailProvider.sendEmail(lead.email, "Visit Request Received", html);
        }
      } catch (err) {
        console.error("Email notification sending failed in agent tool:", err);
      }

      return {
        success: true,
        message: "Your request is submitted, you'll receive a confirmation once validated by our team.",
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
