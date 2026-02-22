import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getRole } from "@/lib/roles";
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildRegenPrompt,
} from "@/lib/prompts";
import type { GeneratedDraft, LinkedInProfile } from "@/lib/types";

const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// Full profile generation (streaming)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, context, currentProfile, regenerate } = body as {
      role: string;
      context: { resumeText: string; notes: string };
      currentProfile: LinkedInProfile | null;
      regenerate?: {
        section: keyof GeneratedDraft;
        guidance: string;
        currentValue: string | string[];
      };
    };

    const targetRole = getRole(role);
    if (!targetRole) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(targetRole);
    const userPrompt = regenerate
      ? buildRegenPrompt(
          regenerate.section,
          regenerate.guidance,
          regenerate.currentValue
        )
      : buildUserPrompt(context, currentProfile);

    // Stream the response via SSE
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start Claude streaming in background
    (async () => {
      try {
        let fullText = "";

        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullText += event.delta.text;

            // Send raw text chunk to client for progress display
            const sseData = JSON.stringify({ type: "chunk", text: event.delta.text });
            await writer.write(encoder.encode(`data: ${sseData}\n\n`));
          }
        }

        // Parse the final JSON from the full response
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const sseData = JSON.stringify({ type: "complete", draft: parsed });
          await writer.write(encoder.encode(`data: ${sseData}\n\n`));
        } else {
          const sseData = JSON.stringify({
            type: "error",
            error: "Failed to parse AI response",
          });
          await writer.write(encoder.encode(`data: ${sseData}\n\n`));
        }
      } catch (error) {
        console.error("Generation error:", error);
        const sseData = JSON.stringify({
          type: "error",
          error: error instanceof Error ? error.message : "Generation failed",
        });
        await writer.write(encoder.encode(`data: ${sseData}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Request error:", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
