import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { searchRelevantChunks } from "@/lib/pinecone/vectorStore";

const RAGState = Annotation.Root({
  question: Annotation<string>({ reducer: (_, x) => x }),
  videoId: Annotation<string>({ reducer: (_, x) => x }),
  videoTitle: Annotation<string>({ reducer: (_, x) => x }),
  videoAuthor: Annotation<string>({ reducer: (_, x) => x }),
  chatHistory: Annotation<Array<{ role: "user" | "assistant"; content: string }>>({
    reducer: (_, x) => x,
  }),
  routeDecision: Annotation<"search_transcript" | "general_knowledge">({
    reducer: (_, x) => x,
  }),
  retrievedChunks: Annotation<string[]>({
    reducer: (_, x) => x,
    default: () => [], // Default is empty array
  }),
  answer: Annotation<string>({ reducer: (_, x) => x }),
  chunksUsed: Annotation<number>({ reducer: (_, x) => x }),
  answerSource: Annotation<"transcript" | "general_knowledge">({
    reducer: (_, x) => x,
  }),
});


type RAGStateType = typeof RAGState.State;



//Step 2: Initiallize the LLM

function getLLM() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  return new ChatGroq({
    apiKey,
    model: "llama-3.1-8b-instant",
    temperature: 0.2,
  });
}

async function routeQuestion(state: RAGStateType): Promise<Partial<RAGStateType>> {
  const llm = getLLM();

  const systemPrompt = `You are a routing assistant for a YouTube video Q&A system.

Your job is to decide whether a user's question requires searching the video transcript
or can be answered from your general knowledge.

Rules:
- If the question is about WHAT WAS SAID in the video, or asks for specific details from the video content → respond with exactly: search_transcript
- If the question is a general knowledge question that doesn't require video-specific information → respond with exactly: general_knowledge
- If the question is just a greeting or small talk → respond with exactly: general_knowledge

Video being discussed: "${state.videoTitle}" by "${state.videoAuthor}"

Respond with ONLY one of these two options (no other text):
search_transcript
general_knowledge`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(state.question),
  ]);

  const decision = response.content.toString().trim().toLowerCase();
  const routeDecision: "search_transcript" | "general_knowledge" =
    decision.includes("general_knowledge") ? "general_knowledge" : "search_transcript";

  console.log(`[LangGraph] routeQuestion: "${state.question}" → ${routeDecision}`);

  return { routeDecision };
}

async function retrieveChunks(state: RAGStateType): Promise<Partial<RAGStateType>> {
  console.log(`[LangGraph] retrieveChunks: searching Pinecone for video ${state.videoId}`);

  const chunks = await searchRelevantChunks(state.question, state.videoId, 5);

  console.log(`[LangGraph] retrieveChunks: found ${chunks.length} chunks`);

  return {
    retrievedChunks: chunks,
    chunksUsed: chunks.length,
  };
}

async function generateAnswer(state: RAGStateType): Promise<Partial<RAGStateType>> {
  const llm = getLLM();

  // Build the system prompt with context
  let systemPrompt = `You are an intelligent assistant that helps users understand YouTube videos.

You are answering questions about the video: "${state.videoTitle}" by "${state.videoAuthor}".

RULES:
- Be concise, accurate, and helpful
- Use markdown formatting (bullet points, bold text) when it makes the answer clearer
- If you're using information from the transcript, answer confidently
- If you're using general knowledge (not from the transcript), mention that briefly
- Keep answers focused and relevant`;

  // Add transcript chunks to the prompt if we retrieved them
  if (state.retrievedChunks && state.retrievedChunks.length > 0) {
    const context = state.retrievedChunks.join("\n\n---\n\n");
    systemPrompt += `\n\nRelevant transcript excerpts:\n\n${context}`;
  }

  const messages: BaseMessage[] = [new SystemMessage(systemPrompt)];

  for (const msg of state.chatHistory) {
    if (msg.role === "user") {
      messages.push(new HumanMessage(msg.content));
    } else {
      messages.push(new AIMessage(msg.content));
    }
  }
  messages.push(new HumanMessage(state.question));


  const response = await llm.invoke(messages);
  const answer = response.content.toString();

  const answerSource =
    state.routeDecision === "general_knowledge" ? "general_knowledge" : "transcript";

  console.log(`[LangGraph] generateAnswer: generated ${answer.length} chars`);

  return {
    answer,
    answerSource,
    chunksUsed: state.retrievedChunks?.length ?? 0,
  };
}


function decideNextStep(state: RAGStateType): "retrieveChunks" | "generateAnswer" {
  if (state.routeDecision === "search_transcript") {
    return "retrieveChunks"; // Go search Pinecone first
  }
  return "generateAnswer"; // Skip search, go straight to generating
}


function buildRAGGraph() {
  const workflow = new StateGraph(RAGState)
    .addNode("routeQuestion", routeQuestion)
    .addNode("retrieveChunks", retrieveChunks)
    .addNode("generateAnswer", generateAnswer)
    .addEdge(START, "routeQuestion")
    .addConditionalEdges("routeQuestion", decideNextStep, {
      retrieveChunks: "retrieveChunks",
      generateAnswer: "generateAnswer",
    })
    .addEdge("retrieveChunks", "generateAnswer")
    .addEdge("generateAnswer", END);

  return workflow.compile();
}



export interface RAGPipelineInput {
  question: string;
  videoId: string;
  videoTitle?: string;
  videoAuthor?: string;
  chatHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface RAGPipelineOutput {
  answer: string;
  chunksUsed: number;
  answerSource: "transcript" | "general_knowledge";
}

export async function runRAGPipeline(input: RAGPipelineInput): Promise<RAGPipelineOutput> {
  const graph = buildRAGGraph();

  const result = await graph.invoke({
    question: input.question,
    videoId: input.videoId,
    videoTitle: input.videoTitle || "",
    videoAuthor: input.videoAuthor || "",
    chatHistory: input.chatHistory || [],
    retrievedChunks: [],
  });

  return {
    answer: result.answer || "I could not generate an answer. Please try again.",
    chunksUsed: result.chunksUsed ?? 0,
    answerSource: result.answerSource || "transcript",
  };
}