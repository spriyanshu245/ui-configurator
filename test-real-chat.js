const OpenAI = require('./node_modules/openai');
const fs = require('fs');

const envPath = './.env';
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const client = new OpenAI({
  baseURL: process.env.FREELLM_BASE_URL,
  apiKey: process.env.FREELLM_API_KEY,
});

async function main() {
  console.log("Registering ts-node...");
  require('C:/Users/priyanshusingh/Desktop/REPOS/My Projects/ui-configurator/node_modules/ts-node').register({
    compilerOptions: {
      module: "nodenext",
      moduleResolution: "nodenext",
      target: "es2022"
    }
  });

  const { buildSystemPrompt } = require('./chat-agent/lib/prompt-builder');
  const tools = require('./chat-agent/lib/tool-definitions').DSL_TOOLS;

  console.log("Building system prompt...");
  const systemPrompt = await buildSystemPrompt({
    micrositeId: "loan-accounts-bak1",
    pageCode: "loan-accounts-bak1_loan-overview",
    id: "loan-accounts-bak1_loan-overview"
  });

  console.log("System Prompt length:", systemPrompt.length);
  console.log("Sample of System Prompt:\n", systemPrompt.substring(0, 1000));

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: "add a page section at top" }
  ];

  console.log("Calling completions stream...");
  try {
    const response = await client.chat.completions.create({
      model: process.env.FREELLM_MODEL || "gemini-2.5-flash",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
      stream: true,
    });

    console.log("Response stream opened successfully.");
    let text = "";
    for await (const chunk of response) {
      if (chunk.choices[0]?.delta?.content) {
        text += chunk.choices[0].delta.content;
      }
      if (chunk.choices[0]?.delta?.tool_calls) {
        console.log("Tool Calls chunk:", JSON.stringify(chunk.choices[0].delta.tool_calls));
      }
    }
    console.log("Finished streaming.");
    console.log("Response Text:\n", text);
  } catch (err) {
    console.error("Stream error:", err.status, err.message);
    if (err.response) {
      try {
        console.error("Error response body:", await err.response.text());
      } catch (e) {}
    }
  }
}

main();
