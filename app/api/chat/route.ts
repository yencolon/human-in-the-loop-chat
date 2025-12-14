import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { start } from "workflow/api";
import { chatWorkflow } from "@/workflows/chat";

export async function POST(request: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();
    const run = await start(chatWorkflow, [messages]);
    const workflowStream = run.readable;

    return createUIMessageStreamResponse({
      stream: workflowStream,
      headers: { "x-workflow-run-id": run.runId },
    });
  } catch (err: any) {
    console.error("api/chat POST error:", {
      message: err?.message,
      stack: err?.stack,
      responseStatus: err?.response?.status,
      responseBody: err?.response?.data ?? err?.response?.body ?? null,
      raw: err,
    });

    return new Response(
      JSON.stringify({
        error: "upstream_provider_error",
        details: err?.message ?? "unknown",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
