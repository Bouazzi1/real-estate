import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slot, type, contact, apartmentId } = body;

    if (!slot || !contact?.name || (!contact?.email && !contact?.phone)) {
      return NextResponse.json(
        { error: "Slot, contact name, and at least one contact channel (email/phone) are required" },
        { status: 400 }
      );
    }

    const requestedSlot = new Date(slot);
    if (isNaN(requestedSlot.getTime())) {
      return NextResponse.json({ error: "Invalid slot date format" }, { status: 400 });
    }

    // 1. Find or create the Lead
    let lead = null;
    
    if (contact.email) {
      lead = await prisma.lead.findFirst({
        where: { email: contact.email },
      });
    }

    if (!lead && contact.phone) {
      lead = await prisma.lead.findFirst({
        where: { phone: contact.phone },
      });
    }

    const interestedIds = apartmentId ? [apartmentId] : [];

    if (!lead) {
      // Create new lead
      lead = await prisma.lead.create({
        data: {
          name: contact.name,
          email: contact.email || null,
          phone: contact.phone || null,
          source: body.source || "FORM",
          score: "WARM", // initial score for booking intent
          interestedApartmentIds: interestedIds,
        },
      });
    } else {
      // Update existing lead with interested apartments if not already listed
      const updatedInterested = Array.from(
        new Set([...(lead.interestedApartmentIds || []), ...interestedIds])
      );
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          name: contact.name, // update name if they provided a new one
          interestedApartmentIds: updatedInterested,
          score: "WARM",
        },
      });
    }

    // 2. Double check if there is an APPROVED appointment at this exact slot
    const conflict = await prisma.appointment.findFirst({
      where: {
        status: "APPROVED",
        requestedSlot,
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "This slot is no longer available. Please select another time." },
        { status: 409 }
      );
    }

    // 3. Create the PENDING Appointment
    const appointment = await prisma.appointment.create({
      data: {
        leadId: lead.id,
        apartmentId: apartmentId || null,
        requestedSlot,
        type: type || "VISIT",
        status: "PENDING",
        adminNote: body.adminNote || null,
      },
      include: {
        lead: true,
        apartment: true,
      },
    });

    // 4. Create database notification log
    await prisma.notification.create({
      data: {
        leadId: lead.id,
        appointmentId: appointment.id,
        channel: "EMAIL",
        template: "APPOINTMENT_REQUESTED",
        status: "QUEUED",
      },
    });

    // 5. Send initial "appointment requested" email using our console/resend email provider
    // (We'll implement actual HTML rendering in a separate utility, but let's trigger it now)
    try {
      const { getEmailProvider } = await import("@/lib/providers/email");
      const emailProvider = getEmailProvider();
      
      const adminLink = `${process.env.NEXTAUTH_URL}/admin/appointments`;
      const emailHtml = `
        <h3>Appointment Request Received</h3>
        <p>Dear ${lead.name},</p>
        <p>We have received your request for a ${appointment.type.toLowerCase()} slot on <strong>${requestedSlot.toLocaleString()}</strong>.</p>
        <p>Our sales team will review the slot and confirm it shortly.</p>
        <br/>
        <p>Elysium Sales Team</p>
      `;

      if (lead.email) {
        await emailProvider.sendEmail(lead.email, "We've received your visit request", emailHtml);
      }
    } catch (emailErr) {
      console.error("Failed to send client booking request email:", emailErr);
    }

    return NextResponse.json(appointment);
  } catch (e: any) {
    console.error("Booking error:", e);
    return NextResponse.json({ error: e.message || "Failed to schedule appointment" }, { status: 500 });
  }
}
