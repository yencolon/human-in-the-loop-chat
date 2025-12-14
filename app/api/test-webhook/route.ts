import { updateSlackMessageDirectly } from "@/lib/slack";
import { resumeHook } from "workflow/api";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const token = payload.token;
    const approved = payload.approved;
    const ts = payload.ts;
    const channelId = payload.channelId;
    const userName = payload.userName;
    const originalMessage = payload.originalMessage;

    if (!token) {
      return Response.json({ error: "Missing token" }, { status: 400 });
    }

    console.log(`Resuming hook with token: ${token}, approved: ${approved}`);

    const result = await resumeHook(`slack:${token}`, {
      approved: approved === true,
      comment:
        approved === true
          ? "Approved via Testing webhook"
          : "Denied via Testing webhook",
    });

    await updateSlackMessageDirectly({
      channelId: channelId,
      ts: ts,
      originalMessage: originalMessage,
      action: approved ? "approve" : "deny",
      userName: userName,
      toolCallId: result.runId,
    });

    return Response.json({ success: true, runId: result.runId });
  } catch (error) {
    return Response.json({ error: "Invalid token" }, { status: 404 });
  }
}
