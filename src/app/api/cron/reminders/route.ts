import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmailProvider } from "@/lib/providers/email";

export async function GET(request: NextRequest) {
  // Simple auth header check (Vercel Cron security pattern)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "local-cron-secret";

  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const emailProvider = getEmailProvider();
    
    let sentCount = 0;

    // 1. Check T-24h Reminders: Appointments occurring between 23h and 25h from now
    const min24h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const max24h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const appts24h = await prisma.appointment.findMany({
      where: {
        status: "APPROVED",
        requestedSlot: { gte: min24h, lte: max24h },
        // Exclude if reminder already logged
        notifications: {
          none: {
            template: "APPOINTMENT_REMINDER_24H",
          },
        },
      },
      include: { lead: true, apartment: true },
    });

    for (const appt of appts24h) {
      if (appt.lead.email) {
        const timeStr = new Date(appt.requestedSlot).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const html = `
          <h3>Viewing Reminder</h3>
          <p>Dear ${appt.lead.name || "Valued Client"},</p>
          <p>This is a friendly reminder that you have a property viewing scheduled for tomorrow at <strong>${timeStr}</strong>.</p>
          <p>Property: ${appt.apartment?.title || "Apartment Visit"}</p>
          <p>We look forward to meeting you.</p>
        `;

        await emailProvider.sendEmail(appt.lead.email, "Reminder: Property viewing tomorrow", html);
        
        // Log notification
        await prisma.notification.create({
          data: {
            leadId: appt.leadId,
            appointmentId: appt.id,
            channel: "EMAIL",
            template: "APPOINTMENT_REMINDER_24H",
            status: "SENT",
            sentAt: new Date(),
          },
        });
        sentCount++;
      }
    }

    // 2. Check T-1h Reminders: Appointments occurring between 45m and 75m from now
    const min1h = new Date(now.getTime() + 45 * 60 * 1000);
    const max1h = new Date(now.getTime() + 75 * 60 * 1000);

    const appts1h = await prisma.appointment.findMany({
      where: {
        status: "APPROVED",
        requestedSlot: { gte: min1h, lte: max1h },
        notifications: {
          none: {
            template: "APPOINTMENT_REMINDER_1H",
          },
        },
      },
      include: { lead: true, apartment: true },
    });

    for (const appt of appts1h) {
      if (appt.lead.email) {
        const html = `
          <h3>Viewing Reminder (1 Hour)</h3>
          <p>Dear ${appt.lead.name || "Valued Client"},</p>
          <p>Your property viewing is starting in 1 hour.</p>
          <p>Property: ${appt.apartment?.title || "Apartment Visit"}</p>
          <p>See you soon!</p>
        `;

        await emailProvider.sendEmail(appt.lead.email, "Reminder: Property viewing in 1 hour", html);
        
        // Log notification
        await prisma.notification.create({
          data: {
            leadId: appt.leadId,
            appointmentId: appt.id,
            channel: "EMAIL",
            template: "APPOINTMENT_REMINDER_1H",
            status: "SENT",
            sentAt: new Date(),
          },
        });
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, remindersSent: sentCount });

  } catch (e: any) {
    console.error("Reminder cron job failure:", e);
    return NextResponse.json({ error: e.message || "Failed to process reminders cron" }, { status: 550 });
  }
}
