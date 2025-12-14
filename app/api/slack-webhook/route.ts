import { updateSlackMessageViaResponseUrl } from "@/lib/slack";
import { verifySlackRequest } from "@/lib/verify-slack-request";
import { SlackActionPayload, SlackActionValue } from "@/types/slack";
import { resumeHook } from "workflow/api";

/**
 * Handles incoming Slack action payloads for human approval responses.
 * This endpoint expect to be called via slack-only, so you can not call it by yourself.
 */
export async function POST(request: Request) {
  const requestClone = request.clone();
  if (!verifySlackRequest(requestClone, await requestClone.text())) {
    return Response.json({ error: "Invalid Slack request" }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    const payload = JSON.parse(
      formData.get("payload") as string
    ) as SlackActionPayload;

    const action = payload.actions[0];
    const value = JSON.parse(action.value) as Omit<SlackActionValue, "comment">;
    const token = value.token;
    const approved = value.approved;

    if (!token) {
      return Response.json({ error: "Missing token" }, { status: 400 });
    }

    const result = await resumeHook(`slack:${token}`, {
      approved: approved === true,
      comment:
        approved === true ? "Approved via webhook" : "Denied via webhook",
    });

    await handleBlockActions(payload);

    return Response.json({ success: true, runId: result.runId });
  } catch (error) {
    return Response.json({ error: "Invalid token" }, { status: 404 });
  }
}

export async function GET() {
  return Response.json({ status: "Slack webhook is running" });
}

// En tu handler:
async function handleBlockActions(payload: SlackActionPayload) {
  const action = payload.actions?.[0];
  const responseUrl = payload.response_url;
  const userName = payload.user.username;
  const value = JSON.parse(action.value);
  const toolCallId = value.toolCallId;
  const actionId = action.action_id;

  await updateSlackMessageViaResponseUrl({
    responseUrl,
    action: actionId === "approve_action" ? "approved" : "denied",
    userName,
    toolCallId,
    originalMessage: payload.message.text,
  });
}
