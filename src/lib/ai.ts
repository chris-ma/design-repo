import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { AnalysisResult } from "@/types/item";

const analysisSchema = z.object({
  title: z.string().describe("A short, descriptive title for the design (max ~8 words)"),
  description: z
    .string()
    .describe(
      "An in-depth critical description of the page's visual design, written in the register of a design/art-history critique for a university-level audience — dense with precise technical vocabulary drawn from typography, visual art, and design theory (e.g. typographic hierarchy, visual rhythm, negative space, chromatic contrast, compositional balance, grid structure, kerning, leading, gestalt grouping, visual weight, focal point, iconography). 4-6 sentences analyzing composition/layout, typographic treatment, color and imagery, and overall mood as a designed artifact. Write as formal critique, never as marketing copy, and never reference the site's industry, product, or subject matter — describe only how it is designed, not what it sells.",
    ),
  tags: z
    .array(z.string())
    .describe(
      "5-10 short tags describing purely visual/structural design language: style, layout type, typography, and mood (e.g. 'minimalist', 'grid layout', 'dark mode', 'brutalist', 'serif headlines'). Do not include the site's industry, product category, or subject matter (e.g. never 'cycling gear', 'fintech', 'skincare') — tags should describe the look, not what the original site sells.",
    ),
  colorPalette: z
    .array(z.string())
    .describe("3-6 dominant hex color codes observed in the screenshot, e.g. '#1a1a2e'"),
  replicationPrompt: z
    .string()
    .describe(
      "A detailed, directly-pasteable prompt for an AI coding tool to recreate this look and feel. Phrase it as an instruction (e.g. 'Build a landing page with...'), covering layout structure, color palette, typography feel, imagery/illustration style, and overall mood.",
    ),
});

let anthropic: Anthropic | undefined;
function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: requireApiKey() });
  }
  return anthropic;
}

function requireApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "Missing required environment variable: ANTHROPIC_API_KEY. Copy .env.example to .env.local and fill it in.",
    );
  }
  return key;
}

interface AnalyzeScreenshotInput {
  imageBase64: string;
  mediaType: "image/png" | "image/jpeg";
  pageTitle?: string;
  pageDescription?: string;
  sourceUrl?: string;
}

export async function analyzeScreenshot({
  imageBase64,
  mediaType,
  pageTitle,
  pageDescription,
  sourceUrl,
}: AnalyzeScreenshotInput): Promise<AnalysisResult> {
  const client = getAnthropicClient();

  const contextLines = [
    sourceUrl ? `Source URL: ${sourceUrl}` : "Source: user-uploaded image (no source URL)",
    pageTitle ? `Page title: ${pageTitle}` : null,
    pageDescription ? `Page description: ${pageDescription}` : null,
  ].filter(Boolean);

  const message = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: [
              "You are a design critic analyzing a screenshot of a website/design shot collected as design inspiration.",
              contextLines.join("\n"),
              "",
              "Analyze the visual design in the screenshot and produce a title, an in-depth critical description, tags, dominant color palette, and a replication prompt suitable for pasting directly into an AI coding tool to rebuild a similar look and feel.",
              "Focus entirely on transferable visual design language — layout, typography, color, imagery style, spacing, mood — not on the industry, product, or subject matter of the original site. The goal is a reusable style reference, not a description of what the site is about.",
              "For the description field specifically, write with the precision and vocabulary of a graduate-level design or art-history critique — the kind of formal, technical language used to analyze a designed artifact, not casual or promotional language.",
            ].join("\n"),
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(analysisSchema),
    },
  });

  if (message.stop_reason === "refusal" || !message.parsed_output) {
    throw new Error("AI analysis was refused or returned no structured output");
  }

  return message.parsed_output;
}
