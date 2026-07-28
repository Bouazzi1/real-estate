import "dotenv/config";
import { executeAgentTool } from "../src/lib/agent/tools";
import { prisma } from "../src/lib/prisma";

async function testBookingTool() {
  console.log("🧪 Testing create_appointment tool execution directly...");

  try {
    const result = await executeAgentTool("create_appointment", {
      name: "Client Test Résidence WAFA",
      email: "test.client@example.com",
      phone: "+216 98 123 456",
      date: "2026-08-05",
      time: "14:30",
      apartmentId: "WAF-101"
    });

    console.log("✅ Tool Execution Result:", result);

    // Verify appointment was saved in database
    const dbAppt = await prisma.appointment.findFirst({
      where: { id: result.appointmentId },
      include: { lead: true, apartment: true }
    });

    if (dbAppt) {
      console.log("\n🎉 Verification SUCCESS! Appointment stored in Database:");
      console.log({
        appointmentId: dbAppt.id,
        status: dbAppt.status,
        requestedSlot: dbAppt.requestedSlot,
        leadName: dbAppt.lead.name,
        leadEmail: dbAppt.lead.email,
        apartmentRef: dbAppt.apartment?.reference || "N/A"
      });
    } else {
      console.error("❌ Appointment NOT found in DB!");
    }

  } catch (err: any) {
    console.error("❌ Booking Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testBookingTool();
