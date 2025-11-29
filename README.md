# GrooveRulesAgent

GrooveRulesAgent is a private OpenAI AgentKit SDK agent that fetches canonical Groove Board workflow rules from Airtable and returns them in normalized JSON form for downstream workflows.

## Secrets
Set the Airtable credentials as agent secrets so the tool can authenticate:

- `AIRTABLE_API_KEY`: Airtable personal access token with read access to the Workflow table.
- `AIRTABLE_BASE_ID`: Airtable base ID (appAngsQknhisNZyY).

## Deployment
Use the OpenAI CLI to deploy the agent:

```bash
openai agents deploy src/agent.ts
```

After deployment, the agent will appear in the OpenAI dashboard as a private agent.

## Local Testing
Run the agent locally with a sample input after building:

```bash
npm install
npm run build
node dist/agent.js --input '{"tool": "get_rules", "arguments": {"nameContains": "approval"}}'
```

The sample call above requests all rules whose names include "approval".
