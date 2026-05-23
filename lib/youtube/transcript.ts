import { YoutubeTranscript } from "youtube-transcript";
import axios from "axios";

export function extractVideoId(url: string): string {
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return shortMatch[1];

    const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (longMatch) return longMatch[1];

    const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return embedMatch[1];

    throw new Error(`Could not extract video ID from URL: ${url}`);
}

export async function fetchVideoMetadata(videoId: string): Promise<{ title: string; author: string }> {
    try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await axios.get(url, { timeout: 5000 });
    return {
      title: response.data.title || "",
      author: response.data.author_name || "",
    };
  } catch {
    return { title: "", author: "" };
  }
}


export async function fetchTranscript(videoId: string, url: string): Promise<{text: string; source: "youtube" | "apify";}> {
    try {
        let transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en"});
        if (!transcriptItems || transcriptItems.length === 0) {
            transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: "hi",});
        }
        if (transcriptItems && transcriptItems.length > 0) {
      const text = transcriptItems
        .map((item) => item.text)
        .join(" ")
        .trim();

      if (text.length > 50) {
        return { text, source: "youtube" };
      }
    }
  } catch (error) {
    console.log("YouTube transcript failed, trying Apify...", error);
  }

  // --- Method 2: Apify Scraper (fallback) ---

    const apifyToken = process.env.APIFY_API_TOKEN;

    if (!apifyToken) {
        throw new Error("YouTube captions are not available for this video, and APIFY_API_TOKEN is not set for fallback. " +
        "Please enable captions on the video or add an Apify token."
    );
    }
    try {
    // Start the Apify actor run
    const runResponse = await axios.post(
      "https://api.apify.com/v2/acts/starvibe~youtube-video-transcript/runs",
      {
        youtube_url: url,
        include_transcript_text: true,
      },
      {
        headers: { Authorization: `Bearer ${apifyToken}` },
        params: { waitForFinish: 120 }, // Wait up to 120 seconds for the scraper to finish
      }
    );

    const defaultDatasetId = runResponse.data.data.defaultDatasetId;
    const datasetResponse = await axios.get(
      `https://api.apify.com/v2/datasets/${defaultDatasetId}/items`,
      { headers: { Authorization: `Bearer ${apifyToken}` } }
    );

    const items = datasetResponse.data;

    for (const item of items) {
      if (item.transcript_text && typeof item.transcript_text === "string") {
        return { text: item.transcript_text.trim(), source: "apify" };
      }
      if (Array.isArray(item.transcript) && item.transcript.length > 0) {
        const text = item.transcript
          .map((e: { text?: string } | string) =>
            typeof e === "string" ? e : e.text || ""
          )
          .join(" ")
          .trim();
        if (text) return { text, source: "apify" };
      }
    }

    throw new Error("Apify returned no transcript data for this video");
    } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`All transcript methods failed: ${message}`);
  }
}
    
export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();

    if (chunk.length > 20) {
      chunks.push(chunk);
    }
    start += chunkSize - overlap;
    }
    return chunks;
}

