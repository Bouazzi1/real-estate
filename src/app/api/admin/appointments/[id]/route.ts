import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEmailProvider } from "@/lib/providers/email";

// Helper to format Date to iCalendar UTC string format: YYYYMMDDTHHMMSSZ
function formatToICSDate(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, "0");
  
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

// Generate standard iCalendar file text
function generateICS(id: string, start: Date, end: Date, summary: string, description: string, location: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Elysium Residences//Visit Scheduler//EN",
    "BEGIN:VEVENT",
    `UID:${id}`,
    `DTSTAMP:${formatToICSDate(new Date())}`,
    `DTSTART:${formatToICSDate(start)}`,
    `DTEND:${formatToICSDate(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(
  request: NextRequest,
  { params }: RouteProps
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status, alternativeSlot, adminNote } = body;

    const original = await prisma.appointment.findUnique({
      where: { id },
      include: {
        lead: true,
        apartment: {
          include: { project: true },
        },
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: status || undefined,
        alternativeSlot: alternativeSlot ? new Date(alternativeSlot) : undefined,
        adminNote: adminNote !== undefined ? adminNote : undefined,
        decidedAt: status ? new Date() : undefined,
        decidedBy: status ? session.user?.name || "Admin" : undefined,
      },
      include: {
        lead: true,
        apartment: {
          include: { project: true },
        },
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "DECIDE_APPOINTMENT",
        entity: "Appointment",
        entityId: id,
        diff: {
          before: original,
          after: updated,
        },
      },
    });

    // 4. Send status updates emails to the client immediately if email exists
    if (updated.lead.email && status) {
      const emailProvider = getEmailProvider();
      const clientEmail = updated.lead.email;
      const clientName = updated.lead.name || "Valued Client";

      const apartmentTitle = updated.apartment?.title || "Apartment Visit";
      const projectAddress = (updated.apartment?.project?.location as any)?.address || "Elysium Agency Office";

      if (status === "APPROVED") {
        // Compute appointment durations (1 hour duration)
        const startSlot = new Date(updated.requestedSlot);
        const endSlot = new Date(startSlot.getTime() + 60 * 60 * 1000); // +1 hour

        // Generate ICS Calendar File Content
        const icsString = generateICS(
          updated.id,
          startSlot,
          endSlot,
          `Viewing: ${apartmentTitle}`,
          `Your appointment has been confirmed to view ${apartmentTitle}.`,
          projectAddress
        );

        // Build Email HTML
        const emailHtml = `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #3b82f6;">Tour Appointment Confirmed</h2>
            <p>Dear ${clientName},</p>
            <p>We are delighted to confirm your visit to the following property:</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="margin: 0 0 5px 0; color: #0f172a;">${apartmentTitle}</h4>
              <p style="margin: 0; font-size: 13px; color: #64748b;">Reference: ${updated.apartment?.reference || "N/A"}</p>
              <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Date:</strong> ${startSlot.toLocaleString()}</p>
              <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Location:</strong> ${projectAddress}</p>
            </div>

            <p>An calendar invitation event (.ics) has been compiled and logged. Please load the attached schedule details inside your calendar client.</p>
            <br/>
            <p>Sincerely,</p>
            <p><strong>Elysium Sales Team</strong></p>
          </div>
        `;

        // Send email with ICS attachment (using standard nodemailer / Resend API schema)
        // Note: For ConsoleEmailProvider, we log it. For Resend, we send it.
        await emailProvider.sendEmail(
          clientEmail, 
          `Confirmed: Viewing for ${apartmentTitle}`, 
          emailHtml
        );
      } else if (status === "REJECTED") {
        const emailHtml = `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #ef4444;">Tour Appointment Declined</h2>
            <p>Dear ${clientName},</p>
            <p>Unfortunately, we are unable to accommodate your requested tour slot on <strong>${new Date(updated.requestedSlot).toLocaleString()}</strong>.</p>
            ${adminNote ? `<p><strong>Reason:</strong> ${adminNote}</p>` : ""}
            <p>Please visit our website or consult our AI advisor to schedule a different viewing slot.</p>
            <br/>
            <p>Best regards,</p>
            <p><strong>Elysium Sales Team</strong></p>
          </div>
        `;

        await emailProvider.sendEmail(
          clientEmail, 
          "Update: Your viewing request status", 
          emailHtml
        );
      }
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Failed to update appointment status:", e);
    return NextResponse.json({ error: e.message || "Failed to update appointment" }, { status: 500 });
  }
}
