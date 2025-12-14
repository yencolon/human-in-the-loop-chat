import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";
import {
  convertToModelMessages,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { askHumanApprovalHook, CUSTOMER_SUPPORT_PROMPT } from "./steps/tools";
import { sendSlackApprobationMessage } from "@/lib/slack";
import z from "zod";
import { askHumanSchema } from "@/schemas/human-approval";

const sendSlackMessageStep = async ({
  customerName,
  issue,
  proposedSolution,
  toolCallId,
}: z.infer<typeof askHumanSchema> & { toolCallId: string }) => {
  "use step";
  return sendSlackApprobationMessage({
    toolCallId,
    text: `
*New customer support escalation request*
*Customer Name:* ${customerName}
*Issue:* ${issue}
*Proposed Solution:* ${proposedSolution}
Please review and respond via the Slack message.`,
    approveAction: {
      token: toolCallId,
      approved: true,
    },
    denyAction: {
      token: toolCallId,
      approved: false,
    },
  });
};

async function executeAskHumanApproval(
  { customerName, issue, proposedSolution }: z.infer<typeof askHumanSchema>,
  { toolCallId }: { toolCallId: string }
) {
  "use workflow";

  const hook = askHumanApprovalHook.create({ token: `slack:${toolCallId}` });
  await sendSlackMessageStep({
    customerName,
    issue,
    proposedSolution,
    toolCallId,
  });
  const result = await hook;

  return result;
}

export const customerSupportTool = {
  askToHuman: {
    description: "Ask human agent for approval",
    inputSchema: askHumanSchema,
    execute: executeAskHumanApproval,
  },
};

export async function chatWorkflow(messages: UIMessage[]) {
  "use workflow";

  console.log("Starting workflow");

  const writable = getWritable<UIMessageChunk>();

  const agent = new DurableAgent({
    model: process.env.AI_GATEWAY_MODEL || "gpt-4-turbo",
    system: CUSTOMER_SUPPORT_PROMPT,
    tools: customerSupportTool,
  });

  await agent.stream({
    messages: convertToModelMessages(messages),
    writable,
  });

  console.log("Finished workflow");
}
