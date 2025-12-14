# Project Setup & Configuration Guide

## 🚀 Getting Started

### Development Server

Run the development server with:

```bash
pnpm dev
```

## 🔧 Prerequisites & Configuration

### 1. Slack Bot Setup

- Create a Slack app with the following scope:
  - **User Token Scope**: `chat:write`
- Configure interactivity and shortcuts:
  - Set the request URL to: `yourdomain.com/api/slack-webhook`
- Obtain and configure the **Signing Secret** in Slack's "Basic Information" section
- Also, you need a TARGET_USER_ID that will receive bot message for approbation.

### 2. Environment Variables

Create a `.env.local` file with the following variables:

```env
# Vercel AI Gateway Configuration
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_api_key_here
AI_GATEWAY_MODEL=your_model_name_here

# Slack Configuration
SLACK_SIGNING_SECRET=your_slack_signing_secret_here
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_TARGET_USER_ID=your_slack_user_id
```

### 3. Vercel AI Gateway

- Obtain an API key from [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- Configure the model name you wish to use through the gateway
- This needs a prompt to work, you can find and edit it in workflows/chat/steps/tools.ts

## 🏗️ Tech Stack

### Core AI & Workflow Libraries

- **[AI SDK](https://ai-sdk.dev/docs/introduction)** - Core AI functionality and models
- **[WORKFLOW](https://useworkflow.dev/docs)** - Workflow orchestration and automation

### UI Components

- **[AI SDK UI](https://ai-sdk.dev/elements)** - For AI-powered UI elements and chat interfaces
- **[shadcn/ui](https://ui.shadcn.com/)** - For styled, accessible UI components

### Backend & Infrastructure

- **Backend**: Slack bot with webhook support
- **Deployment**: Compatible with Vercel (recommended)

## 🔄 Slack Webhook Configuration

1. Navigate to your Slack app's "Interactivity & Shortcuts" settings
2. Enable interactivity
3. Set the Request URL to: `https://yourdomain.com/api/slack-webhook`
4. Save changes

## 🤖 AI & Workflow Integration

### Setting Up AI SDK

Configure the AI provider in your application using AI SDK:

```javascript
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Example usage with Vercel AI Gateway
const response = await streamText({
  model: openai(process.env.AI_GATEWAY_MODEL),
  messages: [...],
});
```
