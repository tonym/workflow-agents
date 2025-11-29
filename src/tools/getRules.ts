import { z } from "zod";

export const getRulesInputSchema = z.object({
  ruleId: z.number().int().positive().optional(),
  nameContains: z.string().min(1).optional(),
  categoryEquals: z.string().min(1).optional(),
  canonicalTextContains: z.string().min(1).optional(),
});

export type GetRulesInput = z.infer<typeof getRulesInputSchema>;

export type GrooveRule = {
  ruleId: number | null;
  name: string | null;
  category: string | null;
  description: string | null;
  canonicalText: string | null;
  status: string | null;
  version: number | null;
  agentNotes: string | null;
  embeddingId: string | null;
  grooveBoardLink: string | null;
  ruleSummaryAi: string | null;
  ruleCategoryAi: string | null;
};

export type GetRulesResult = {
  rules: GrooveRule[];
};

const AIRTABLE_BASE_URL = "https://api.airtable.com/v0";

const escapeFormulaValue = (value: string): string => value.replace(/"/g, '\\"');

const buildFilterFormula = (input: GetRulesInput): string | undefined => {
  const conditions: string[] = [];

  if (typeof input.ruleId === "number") {
    conditions.push(`{Rule ID} = ${input.ruleId}`);
  }

  if (input.nameContains) {
    const value = escapeFormulaValue(input.nameContains);
    conditions.push(`FIND("${value}", {Name})`);
  }

  if (input.categoryEquals) {
    const value = escapeFormulaValue(input.categoryEquals);
    conditions.push(`{Category} = "${value}"`);
  }

  if (input.canonicalTextContains) {
    const value = escapeFormulaValue(input.canonicalTextContains);
    conditions.push(`FIND("${value}", {Canonical Text})`);
  }

  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return `AND(${conditions.join(", ")})`;
};

export const getRules = async (
  input: GetRulesInput,
  context: { secrets: Record<string, string>; fetch: typeof fetch }
): Promise<GetRulesResult> => {
  const apiKey = context.secrets.AIRTABLE_API_KEY;
  const baseId = context.secrets.AIRTABLE_BASE_ID;

  if (!apiKey) {
    throw new Error("Missing Airtable API key in secrets (AIRTABLE_API_KEY)");
  }

  if (!baseId) {
    throw new Error("Missing Airtable Base ID in secrets (AIRTABLE_BASE_ID)");
  }

  const filterFormula = buildFilterFormula(input);
  const searchParams = new URLSearchParams();
  searchParams.set("maxRecords", "100");

  if (filterFormula) {
    searchParams.set("filterByFormula", filterFormula);
  }

  const url = `${AIRTABLE_BASE_URL}/${baseId}/Workflow?${searchParams.toString()}`;

  const response = await context.fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Airtable request failed with status ${response.status}: ${body}`);
  }

  const data: { records: Array<{ fields: Record<string, unknown> }> } = await response.json();

  const rules: GrooveRule[] = data.records.map(({ fields }) => ({
    ruleId: typeof fields["Rule ID"] === "number" ? (fields["Rule ID"] as number) : null,
    name: typeof fields["Name"] === "string" ? (fields["Name"] as string) : null,
    category: typeof fields["Category"] === "string" ? (fields["Category"] as string) : null,
    description:
      typeof fields["Description"] === "string" ? (fields["Description"] as string) : null,
    canonicalText:
      typeof fields["Canonical Text"] === "string" ? (fields["Canonical Text"] as string) : null,
    status: typeof fields["Status"] === "string" ? (fields["Status"] as string) : null,
    version:
      typeof fields["Version"] === "number" || typeof fields["Version"] === "string"
        ? Number(fields["Version"])
        : null,
    agentNotes:
      typeof fields["Agent Notes"] === "string" ? (fields["Agent Notes"] as string) : null,
    embeddingId:
      typeof fields["Embedding ID"] === "string" ? (fields["Embedding ID"] as string) : null,
    grooveBoardLink:
      typeof fields["Groove Board Link"] === "string"
        ? (fields["Groove Board Link"] as string)
        : null,
    ruleSummaryAi:
      typeof fields["Rule Summary AI"] === "string" ? (fields["Rule Summary AI"] as string) : null,
    ruleCategoryAi:
      typeof fields["Rule Category AI"] === "string"
        ? (fields["Rule Category AI"] as string)
        : null,
  }));

  return { rules };
};
