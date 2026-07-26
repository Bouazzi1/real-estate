import "dotenv/config";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function testBookingFix() {
  console.log("🤖 Testing booking appointment resolution for AUR-302...");
  const url = "http://localhost:3001/api/chat";

  const payload = {
    sessionId: `test_booking_${Date.now()}`,
    apartmentReference: "AUR-302",
    messages: [
      {
        role: "user",
        content: "Bonjour, je m'appelle Sami Ben Ali (email: sami.benali@example.tn, tel: +216 20 123 456). Je souhaite réserver un rendez-vous pour visiter l'appartement AUR-302 le 27 juillet 2026 à 10h00."
      }
    ]
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Chat API responded with ${res.status}`);

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error("No response stream");

    process.stdout.write("Stream response: ");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      process.stdout.write(decoder.decode(value));
    }

    console.log("\n\n✅ Booking simulation stream finished successfully!");
  } catch (err: any) {
    console.error("❌ Test failed:", err.message || err);
  }
}

testBookingFix();
