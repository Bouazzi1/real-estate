import "dotenv/config";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function main() {
  console.log("🤖 Simulating Client Chat Request to Résidence Folla AI Advisor...");
  console.log("Query: 'quels sont les offres disponibles ?'\n");

  const url = "http://localhost:3001/api/chat";
  
  const payload = {
    sessionId: `test_session_${Date.now()}`,
    messages: [
      {
        role: "user",
        content: "quels sont les offres disponibles ?"
      }
    ]
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Chat API responded with status ${res.status}`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Response body is not a stream");
    }

    process.stdout.write("Stream response: ");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      process.stdout.write(chunk);
    }
    
    console.log("\n\n✅ Stream completed successfully!");
  } catch (err: any) {
    console.error("❌ Chat simulation failed:", err.message || err);
  }
}

main();
