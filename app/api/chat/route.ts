import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { start } from "workflow/api";
import { chatWorkflow } from "@/workflows/chat";

// export const maxDuration = 8;

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();
  const run = await start(chatWorkflow, [messages]);
  const workflowStream = run.readable;

  return createUIMessageStreamResponse({
    stream: workflowStream,
    headers: {
      "x-workflow-run-id": run.runId,
    },
  });
}
