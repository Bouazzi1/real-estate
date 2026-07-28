import "dotenv/config";
import { getAvailableSlotsForDate } from "../src/lib/appointments";

async function testAugust1() {
  console.log("🧪 Testing getAvailableSlotsForDate for 1er Août 2026 (Saturday)...");

  const slots = await getAvailableSlotsForDate(new Date("2026-08-01"));
  console.log("Found Slots Count:", slots.length);
  console.log("Slots:", slots.map(s => s.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })));
}

testAugust1();
