import { Pinecone } from "@pinecone-database/pinecone";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { PineconeStore } from "@langchain/pinecone";
import { Document } from "@langchain/core/documents";

function getPineconeClient(): Pinecone {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) throw new Error("PINECONE_API_KEY is not set in environment variables");
  return new Pinecone({ apiKey });
}

function getEmbeddings(): HuggingFaceTransformersEmbeddings {
  return new HuggingFaceTransformersEmbeddings({
    model: "Xenova/all-MiniLM-L6-v2",
  });
}


export async function storeTranscriptChunks(
  chunks: string[],  // Array of transcript text pieces
  videoId: string    // YouTube video ID (used to filter searches later)
): Promise<number> {
  const pinecone = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX;
  if (!indexName) throw new Error("PINECONE_INDEX is not set");

  const index = pinecone.Index(indexName);
  const embeddings = getEmbeddings();
    const documents = chunks.map(
    (chunk) =>
      new Document({
        pageContent: chunk,           // The actual transcript text
        metadata: { videoId },        // Tag with the video ID
      })
  );
  await PineconeStore.fromDocuments(documents, embeddings, {
    pineconeIndex: index,
    namespace: videoId, // Use videoId as namespace for clean isolation per video
  });

  return chunks.length;
}


export async function searchRelevantChunks(
  question: string,  // The user's question
  videoId: string,   // Only search within this video's chunks
  topK: number = 5   // How many results to return
): Promise<string[]> {
  const pinecone = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX;
  if (!indexName) throw new Error("PINECONE_INDEX is not set");

  const index = pinecone.Index(indexName);
  const embeddings = getEmbeddings();

  // Connect to the existing Pinecone store
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
    namespace: videoId, // Only look in this video's namespace
  });

  // similarity search:
  // 1. Converts the question to a 384-dim vector using MiniLM (locally, free!)
  // 2. Finds the 5 most similar vectors in Pinecone (by cosine similarity)
  // 3. Returns the original text for those vectors
  const results = await vectorStore.similaritySearch(question, topK);

  return results.map((doc) => doc.pageContent);
}

export async function videoAlreadyIngested(videoId: string): Promise<boolean> {
  try {
    const pinecone = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX;
    if (!indexName) return false;

    const index = pinecone.Index(indexName);

    // Fetch stats for this namespace
    const stats = await index.describeIndexStats();
    const namespaces = stats.namespaces ?? {};

    // If this videoId namespace exists and has vectors, it's already ingested
    return !!namespaces[videoId] && (namespaces[videoId].recordCount ?? 0) > 0;
  } catch {
    return false;
  }
}