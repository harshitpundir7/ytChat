import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "YTChat — Chat with Any YouTube Video",
  description:
    "AI-powered YouTube video Q&A. Paste a URL, ask questions, get instant answers powered by LangGraph RAG and Groq.",
  keywords: ["YouTube AI", "video chat", "RAG", "LangGraph", "Groq", "AI assistant"],
  openGraph: {
    title: "YTChat — Chat with Any YouTube Video",
    description: "AI-powered YouTube video Q&A using LangGraph RAG.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}