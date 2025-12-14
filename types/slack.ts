/**
 * Here we call the slack api to send message and update messages
 */
import { humanApprovalResponseSchema } from "@/schemas/human-approval";
import { z } from "zod";

export interface SlackActionPayload {
  type: string;
  user: {
    id: string;
    username: string;
    name: string;
    team_id: string;
  };
  api_app_id: string;
  token: string;
  container: {
    type: string;
    message_ts: string;
    channel_id: string;
    is_ephemeral: boolean;
  };
  trigger_id: string;
  team: {
    id: string;
    domain: string;
  };
  enterprise: null | object;
  is_enterprise_install: boolean;
  channel: {
    id: string;
    name: string;
  };
  message: {
    user: string;
    type: string;
    ts: string;
    bot_id: string;
    app_id: string;
    text: string;
    team: string;
    blocks: object[];
  };
  state: {
    values: Record<string, any>;
  };
  response_url: string;
  actions: ToolCallSlackAction[];
}

export interface ToolCallSlackAction {
  confirm: {
    title: {
      type: string;
      text: string;
    };
    text: {
      type: string;
      text: string;
    };
    confirm: {
      type: string;
      text: string;
    };
    deny: {
      type: string;
      text: string;
    };
  };
  action_id: string;
  block_id: string;
  text: {
    type: string;
    text: string;
    emoji: boolean;
  };
  value: string; // JSON stringified object containing token and approve boolean
  style: string;
  type: string;
  action_ts: string;
}

export type SlackActionValue = z.infer<typeof humanApprovalResponseSchema> & {
  token: string;
};

export interface SlackMessage {
  type: string;
  user?: string;
  text: string;
  ts: string;
  bot_id?: string;
  app_id?: string;
  blocks?: object[];
  [key: string]: any;
}

// 2. Internal types for safely casting the loose 'object[]' blocks
export interface SlackBlock {
  type: string;
  block_id?: string;
  elements?: SlackBlockElement[];
  [key: string]: any;
}

export interface SlackBlockElement {
  type: string;
  action_id?: string;
  value?: string; // This is where your JSON { token, approved } lives
  text?: any;
}

// 3. The payload expected inside the button value
export interface HiddenActionValue {
  approved: boolean;
  token: string;
}
