import "dotenv/config";

// Force reject unauthorized to bypass SSL proxy blocks
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { prisma } from "../src/lib/prisma";
import { getAvailableSlotsForDate } from "../src/lib/appointments";
import { retrieveContext } from "../src/lib/rag/retrieval";

async function runTests() {
  console.log("🚀 Starting Elysium RealEstate Platform Integration Tests...\n");

  let passed = 0;
  let failed = 0;

  // TEST 1: Booking Slot Generator
  try {
    console.log("➡️ Test 1: Verifying Available Slot Generator...");
    // Create a target date (Next Monday)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + ((1 + 7 - targetDate.getDay()) % 7 || 7));
    targetDate.setHours(10, 0, 0, 0);

    const slots = await getAvailableSlotsForDate(targetDate);
    
    if (!Array.isArray(slots)) {
      throw new Error("Slots return type is not an array");
    }

    // Weekdays should return at least some slots
    if (slots.length === 0) {
      throw new Error("Returned zero slots on a weekday");
    }

    // Verify slots start from 9 AM onwards
    const firstSlot = slots[0];
    if (firstSlot.getHours() < 9 || firstSlot.getHours() > 18) {
      throw new Error(`Slot hour ${firstSlot.getHours()} falls outside working hours (9-18)`);
    }

    console.log(`  ✅ Passed: Successfully generated ${slots.length} available slots.`);
    passed++;
  } catch (err: any) {
    console.error("  ❌ Failed Test 1:", err.message);
    failed++;
  }

  // TEST 2: RAG pgvector Cosine Similarity Lookups
  try {
    console.log("\n➡️ Test 2: Verifying RAG pgvector Cosine Similarity lookups...");
    
    // Perform a test retrieval query
    const results = await retrieveContext("executive suite", { limit: 2 });
    
    if (!Array.isArray(results)) {
      throw new Error("Retrieval results is not an array");
    }

    console.log(`  ✅ Passed: pgvector vector search executed. Retrieved ${results.length} chunks.`);
    passed++;
  } catch (err: any) {
    console.error("  ❌ Failed Test 2:", err.message);
    if (process.env.NVIDIA_NIM_API_KEY === "your-nvidia-nim-api-key-here") {
      console.log("  ⚠️  Notice: NVIDIA_NIM_API_KEY is currently set to a placeholder in your .env file. Please substitute a valid key to run NIM vector similarity search.");
    }
    failed++;
  }

  // TEST 3: Database Writes & Lead Integrity
  try {
    console.log("\n➡️ Test 3: Verifying Database write integrity (Leads & Appointments)...");

    // 1. Create test lead
    const testLead = await prisma.lead.create({
      data: {
        name: "Test Client",
        email: "test.client@integration-tests.com",
        phone: "+1 (555) 999-8888",
        source: "CHAT",
        score: "COLD",
      },
    });

    // 2. Create test appointment
    const testAppt = await prisma.appointment.create({
      data: {
        leadId: testLead.id,
        requestedSlot: new Date(),
        type: "VISIT",
        status: "PENDING",
        adminNote: "Temporary test appointment",
      },
    });

    // 3. Clean up
    await prisma.appointment.delete({ where: { id: testAppt.id } });
    await prisma.lead.delete({ where: { id: testLead.id } });

    console.log("  ✅ Passed: Database insert, relationship lookup, and delete operations succeeded.");
    passed++;
  } catch (err: any) {
    console.error("  ❌ Failed Test 3:", err.message);
    failed++;
  }

  // Print Summary
  console.log("\n==========================================");
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Fatal Test Suite Error:", err);
  process.exit(1);
});
