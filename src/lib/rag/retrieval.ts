import { prisma } from "../prisma";
import { getLLMProvider } from "../providers/llm";

export interface RetrievalResult {
  id: string;
  content: string;
  documentId: string | null;
  apartmentId: string | null;
  metadata: any;
  similarity: number;
}

// Simple greeting detector to skip unnecessary vector API calls for instant response
function isSimpleGreeting(text: string): boolean {
  const clean = text.trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
  const greetings = [
    "hello", "hi", "hey", "bonjour", "bonsoir", "salut", "coucou",
    "good morning", "good evening", "ca va", "ça va", "merci", "thanks", "thank you"
  ];
  return greetings.includes(clean);
}

export async function retrieveContext(
  query: string,
  options: { apartmentId?: string; limit?: number; minSimilarity?: number } = {}
): Promise<RetrievalResult[]> {
  const { apartmentId, limit = 3, minSimilarity = 0.20 } = options;

  // Fast-path: Skip remote embedding API call for simple greetings
  if (isSimpleGreeting(query)) {
    return [];
  }

  const llm = getLLMProvider();
  
  try {
    // Compute search query vector embedding (using 'query' mode)
    const queryEmbedding = await llm.generateEmbedding(query, "query");
    const embeddingString = `[${queryEmbedding.join(",")}]`;

    let results: RetrievalResult[] = [];

    if (apartmentId) {
      // Cosine distance vector match filtered by apartment context
      results = await prisma.$queryRawUnsafe<RetrievalResult[]>(
        `SELECT id, content, "documentId", "apartmentId", metadata,
                1 - (embedding <=> $1::vector) as similarity
         FROM "DocumentChunk"
         WHERE "apartmentId" = $2 AND 1 - (embedding <=> $1::vector) > $3
         ORDER BY similarity DESC LIMIT $4`,
        embeddingString,
        apartmentId,
        minSimilarity,
        limit
      );
    } else {
      // Global cosine distance vector match
      results = await prisma.$queryRawUnsafe<RetrievalResult[]>(
        `SELECT id, content, "documentId", "apartmentId", metadata,
                1 - (embedding <=> $1::vector) as similarity
         FROM "DocumentChunk"
         WHERE 1 - (embedding <=> $1::vector) > $2
         ORDER BY similarity DESC LIMIT $3`,
        embeddingString,
        minSimilarity,
        limit
      );
    }

    return results;
  } catch (e) {
    console.error("Cosine distance vector retrieval failed:", e);
    return [];
  }
}
