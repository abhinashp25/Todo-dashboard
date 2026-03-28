import { NextRequest } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a productivity expert that decomposes tasks into subtasks.
Output ONLY a raw JSON array. No markdown, no code blocks, no backticks, no explanation.
Each object must have exactly:
- "title": string (actionable, starts with a verb, max 60 chars)
- "priority": "low" | "medium" | "high" | "critical"
- "rationale": string (why this matters, max 80 chars)
Output 3-5 subtasks ordered by execution sequence. ONLY the JSON array, nothing else.`;

export async function POST(req: NextRequest) {
  try {
    const { title, priority, agent, recentTasks } = await req.json();
    if (!title || title.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Title too short" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }
    const contextParts = [`Task: "${title.trim()}"`];
    if (priority) contextParts.push(`Priority: ${priority}`);
    if (agent)    contextParts.push(`Assigned to: ${agent}`);
    if (recentTasks?.length > 0) {
      contextParts.push(`Recent tasks:\n${recentTasks.slice(0,5).map((t: string) => `- ${t}`).join("\n")}`);
    }
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: contextParts.join("\n") },
      ],
      max_tokens: 600,
      temperature: 0.3,
    });
    const raw     = completion.choices[0]?.message?.content ?? "[]";
    const cleaned = raw.replace(/```json\s*/gi,"").replace(/```\s*/gi,"").trim();
    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch {
      return new Response(JSON.stringify({ error: "AI returned invalid format. Try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err: unknown) {
    console.error("[/api/decompose]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}