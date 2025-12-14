import { SlackActionValue, SlackMessage } from "@/types/slack";

const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_API_BASE = "https://slack.com/api";
const TARGET_USER_ID = process.env.SLACK_TARGET_USER_ID;

export const sendSlackApprobationMessage = async ({
  toolCallId,
  text,
  approveAction,
  denyAction,
}: {
  toolCallId: string;
  text: string;
  approveAction: Omit<SlackActionValue, "comment">; // This to make sure user sends what webhooks expects
  denyAction: Omit<SlackActionValue, "comment">; // This to make sure user sends what webhooks expects
}) => {
  console.log("📤 Sending Slack message for tool call:", toolCallId);

  try {
    // 1. Open a DM channel with the user
    const openRes = await fetch(`${SLACK_API_BASE}/conversations.open`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        users: TARGET_USER_ID,
      }),
    });

    const openData = await openRes.json();

    if (!openData.ok) {
      throw new Error(`conversations.open failed: ${openData.error}`);
    }

    const channelId = openData.channel?.id;
    if (!channelId) {
      throw new Error("No channel ID returned from conversations.open");
    }

    // 2. Post message with Approve and Deny buttons
    const messageRes = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        channel: channelId,
        text: text,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${text}`,
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "✅ Approve",
                  emoji: true,
                },
                style: "primary",
                action_id: "approve_action",
                value: JSON.stringify(approveAction),
                confirm: {
                  title: {
                    type: "plain_text",
                    text: "Confirm Approval",
                  },
                  text: {
                    type: "mrkdwn",
                    text: "Are you sure you want to approve this request?",
                  },
                  confirm: {
                    type: "plain_text",
                    text: "Yes, approve",
                  },
                  deny: {
                    type: "plain_text",
                    text: "Cancel",
                  },
                },
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "❌ Deny",
                  emoji: true,
                },
                style: "danger",
                action_id: "deny_action",
                value: JSON.stringify(denyAction),
                confirm: {
                  title: {
                    type: "plain_text",
                    text: "Confirm Denial",
                  },
                  text: {
                    type: "mrkdwn",
                    text: "Are you sure you want to deny this request?",
                  },
                  confirm: {
                    type: "plain_text",
                    text: "Yes, deny",
                  },
                  deny: {
                    type: "plain_text",
                    text: "Cancel",
                  },
                },
              },
            ],
          },
        ],
      }),
    });

    const messageData = await messageRes.json();

    if (!messageData.ok) {
      throw new Error(`chat.postMessage failed: ${messageData.error}`);
    }

    console.log("Message sent:", messageData.ts);
  } catch (err) {
    console.error("Slack API error:", err);

    // Optional: handle missing_scope (you can inspect err.message)
    if (err instanceof Error && err.message.includes("missing_scope")) {
      console.error(
        "Missing Slack scopes: ensure your app has `chat:write` and `conversations:write` scopes and reinstall the app."
      );
    }

    throw err;
  }

  return { success: true, message: "Slack notification sent" };
};

export const updateSlackMessageViaResponseUrl = async ({
  responseUrl,
  action,
  userName,
  toolCallId,
  originalMessage,
}: {
  responseUrl: string;
  action: "approved" | "denied";
  userName: string;
  toolCallId: string;
  originalMessage?: string;
}) => {
  try {
    const actionText = action === "approved" ? "✅ Approved" : "❌ Denied";

    // Usar response_url para actualizar el mensaje
    const updateRes = await fetch(responseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        replace_original: true, // Esto reemplaza el mensaje original
        text: `${actionText} by <@${userName}>`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${originalMessage}\n\n*${actionText}*\n\n<@${userName}> ${action} this request.`,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `ID: ${toolCallId} • ${new Date().toLocaleString()}`,
              },
            ],
          },
        ],
      }),
    });

    if (!updateRes.ok) {
      console.error(
        `Failed to update via response_url: ${await updateRes.text()}`
      );
      return { success: false };
    }

    console.log(`Message updated via response_url`);
    return { success: true };
  } catch (err) {
    console.error("Error updating Slack message via response_url:", err);
    return { success: false, error: err };
  }
};

/**
 * This functions is merely for debugging purposes.
 */
export const getBotMessagesToUser = async ({
  limit = 100,
}: {
  limit?: number;
}) => {
  console.log(`📥 Retrieving last ${limit} messages for user:`, TARGET_USER_ID);

  try {
    // 1. Get the DM Channel ID (Same logic as your send function)
    // We must ensure we have the channel ID for the specific user
    const openRes = await fetch(`${SLACK_API_BASE}/conversations.open`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        users: TARGET_USER_ID,
      }),
    });

    const openData = await openRes.json();

    if (!openData.ok) {
      throw new Error(`conversations.open failed: ${openData.error}`);
    }

    const channelId = openData.channel?.id;

    // 2. Fetch History from that Channel
    // We use URLSearchParams for GET requests
    const params = new URLSearchParams({
      channel: channelId,
      limit: limit.toString(),
    });

    const historyRes = await fetch(
      `${SLACK_API_BASE}/conversations.history?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SLACK_TOKEN}`,
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );

    const historyData = await historyRes.json();

    if (!historyData.ok) {
      throw new Error(`conversations.history failed: ${historyData.error}`);
    }

    const allMessages: SlackMessage[] = historyData.messages || [];

    // 3. Filter for messages sent by the Bot
    // Messages sent by a Slack App/Bot will typically have a 'bot_id' field.
    // If you are using a User Token, you might need to check 'user' id instead.
    // Assuming Bot Token here:
    const botMessages = allMessages.filter(
      (msg) => msg.bot_id !== undefined || msg.subtype === "bot_message"
    );

    console.log(
      `Found ${botMessages.length} bot messages out of ${allMessages.length} total.`
    );

    return {
      success: true,
      messages: botMessages,
      channelId: channelId,
      hasMore: historyData.has_more,
    };
  } catch (err) {
    console.error("Slack History API error:", err);

    if (err instanceof Error && err.message.includes("missing_scope")) {
      console.error(
        "Missing Slack scopes: ensure your app has `im:history` or `channels:history` scopes."
      );
    }

    throw err;
  }
};

export const updateSlackMessageDirectly = async ({
  channelId,
  ts,
  action,
  userName, // Ensure this is a Name (e.g., "Admin") or ID
  originalMessage,
  toolCallId,
}: {
  channelId: string;
  ts: string;
  action: string;
  userName: string;
  toolCallId: string;
  originalMessage?: string;
}) => {
  const actionText = action === "approved" ? "Approved" : "Denied";
  // Fallback if originalMessage is missing to prevent "undefined" in text
  const baseText = originalMessage || "Request processed";

  try {
    const res = await fetch(`${SLACK_API_BASE}/chat.update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        channel: channelId,
        ts: ts,
        // The main text notification (seen in notifications/sidebars)
        text: `${actionText} by ${userName}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              // We combine the original text + the status update
              // Crucial: We do NOT add an 'actions' block here, so buttons are deleted.
              text: `${baseText}\n\n*${actionText}*\n\n*${userName}* ${action} this request via Dashboard Simulation.`,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `ID: ${toolCallId} • Updated via Dashboard • ${new Date().toLocaleString()}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(`chat.update failed: ${data.error}`);
    }

    console.log("Message updated successfully (buttons removed)");
    return { success: true };
  } catch (err) {
    console.error("Error updating Slack message:", err);
    return { success: false, error: err };
  }
};
