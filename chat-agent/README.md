# Chat Agent for Microsite UI Configurator

## Overview

This directory contains a self-contained chat agent overlay for the Next.js UI Configurator application. The agent assists users in viewing, understanding, modifying, and managing UI DSL structures using a conversational interface powered by large language models.

## Architecture

- **LLM Integration**: The agent is powered by FreeLLMAPI out-of-the-box using the OpenAI SDK format. It falls back to NVIDIA NIM natively if required.
- **Storage**: We migrated to **`mongodb`** for local state management (`skill_entries`, `dsl_history`, `tool_call_log`, `user_preferences`). It aligns with the existing MongoDB connection context, allowing for a scalable and consolidated database layer.
- **Knowledge base**: Driven by auto-compiled markdown (`agentSkill.md`) that self-updates via reflection.

## Setup Instructions

1. **Environment Variables**:
   In your Next.js `.env.local` add the following:
   \`\`\`env
   FREELLM_BASE_URL=http://localhost:3003/v1
   FREELLM_API_KEY=your-freellm-api-key
   FREELLM_MODEL=auto

   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=antigravity
   \`\`\`

2. **Dependencies**:
   From within \`chat-agent/\`, install its isolated dependencies if developing standalone, or ensure they are added to the root package:
   \`\`\`bash
   npm install fast-json-patch openai mongodb react-syntax-highlighter uuid
   \`\`\`

3. **Mounting**:
   Render the \`ChatPanel\` in your root \`layout.tsx\` or main application page context:
   \`\`\`tsx
   import { ChatPanel } from '../chat-agent/components/ChatPanel';

   // inside your component
   <ChatPanel micrositeId="loan-accounts" sessionId="session-123" />
   \`\`\`

## Operation & Features

- **Agent Knowledge Updates**: The agent periodically runs reflection logic on completed tasks and compiles knowledge into `agentSkill.md` to be injected into the prompt, continuously improving its capabilities.
- **Rollback Foundation**: It preserves history on every change approved to easily manage rolling back state. Use the `SkillDebugPanel` component directly if debugging prompts in a dev environment.

## Known Limitations & Future Work

- Rollbacks UI is stubbed. A full integration where the inverse patch is verified and sent to backend is ready but gated.
- Needs integration with existing auth if it is session based (ensure `fetch` calls in `microsite-loader` are aligned with your HTTP client configs for Next.js proxying).
