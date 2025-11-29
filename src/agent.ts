import { agent, tool } from "openai/agents";
import { getRules, getRulesInputSchema } from "./tools/getRules.js";

const getRulesTool = tool({
  name: "get_rules",
  description:
    "Fetch canonical Groove Board workflow rules from Airtable's Workflow table in normalized form.",
  parameters: getRulesInputSchema,
  execute: async (input, context) => getRules(input, context),
});

const GrooveRulesAgent = agent({
  name: "GrooveRulesAgent",
  model: "gpt-5.1",
  instructions:
    "You are GrooveRulesAgent. You fetch canonical workflow rules for Groove Board from Airtable's Workflow table and return them as normalized JSON so other agents can consume them. Always use the get_rules tool to retrieve authoritative rule details.",
  tools: { get_rules: getRulesTool },
});

export default GrooveRulesAgent;
