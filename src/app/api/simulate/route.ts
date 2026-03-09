import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";
import { Mistral } from "@mistralai/mistralai";
import { withX402 } from "@x402/next";
import { simulateRouteConfig, resourceServer } from "@/lib/x402";

export const maxDuration = 60; // Allow up to 60 seconds for simulation

interface SimulateRequest {
  knowledgeId: string;
  title: string;
  problem: string;
  solution: string;
  category: string;
}

interface SimulationResult {
  success: boolean;
  logs: string[];
  error?: string;
  testsPassed: number;
  testsFailed: number;
  verdict: "SUCCESS" | "FAILURE" | "ERROR";
  simulationType: "code" | "theoretical";
  generatedScript?: string;
  analysis?: string;
}

// ============================================================================
// STEP 1: Classify if the solution is code-based or theoretical
// ============================================================================

const CLASSIFIER_PROMPT = `You are a solution classifier. Analyze the given problem and solution to determine if validation requires CODE EXECUTION or THEORETICAL REVIEW.

Respond with ONLY one word: "code" or "theoretical"

Use "code" if the solution:
- Contains actual code snippets, functions, or algorithms
- Describes specific implementation steps that can be tested programmatically
- Involves configuration files, scripts, or commands that produce testable output
- Can be validated by running assertions against expected behavior

Use "theoretical" if the solution:
- Is conceptual, architectural, or design-focused
- Explains WHY something happens without specific implementation
- Provides best practices, guidelines, or recommendations
- Describes processes, workflows, or decision-making approaches
- Cannot be meaningfully validated through code execution`;

async function classifySolution(
  mistral: Mistral,
  problem: string,
  solution: string
): Promise<"code" | "theoretical"> {
  const response = await mistral.chat.complete({
    model: "ministral-14b-2512",
    messages: [
      { role: "system", content: CLASSIFIER_PROMPT },
      { role: "user", content: `PROBLEM:\n${problem}\n\nSOLUTION:\n${solution}` },
    ],
    temperature: 0,
    maxTokens: 10,
  });

  const content = response.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.toLowerCase().includes("code")) {
    return "code";
  }
  return "theoretical";
}

// ============================================================================
// STEP 2A: Code-based validation (generate tests + run in E2B)
// ============================================================================

const CODE_TEST_PROMPT = `You are an expert QA engineer. Create a test script that validates the proposed solution.

RULES:
- Write ONLY valid JavaScript/Node.js code (no TypeScript)
- Use console.log for output with prefixes: [SETUP], [TEST], [PASS], [FAIL], [RESULT]
- Self-contained (no external dependencies beyond Node built-ins)
- Include 3+ test cases covering different aspects
- End with: "TESTS: X passed, Y failed" and "VERDICT: SUCCESS" or "VERDICT: FAILURE"
- Keep under 100 lines
- Execute in under 5 seconds

OUTPUT: Return ONLY executable JavaScript code, no markdown or explanations.`;

async function generateTestScript(
  mistral: Mistral,
  problem: string,
  solution: string,
  title: string,
  category: string
): Promise<string> {
  const response = await mistral.chat.complete({
    model: "ministral-14b-2512",
    messages: [
      { role: "system", content: CODE_TEST_PROMPT },
      {
        role: "user",
        content: `CATEGORY: ${category}\nTITLE: ${title}\n\nPROBLEM:\n${problem}\n\nSOLUTION:\n${solution}\n\nWrite a Node.js test script.`,
      },
    ],
    temperature: 0.3,
    maxTokens: 2000,
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Failed to generate test script from Mistral");
  }

  let script = content.trim();
  if (script.startsWith("```javascript") || script.startsWith("```js")) {
    script = script.replace(/^```(?:javascript|js)\n?/, "").replace(/```$/, "");
  } else if (script.startsWith("```")) {
    script = script.replace(/^```\n?/, "").replace(/```$/, "");
  }

  return script.trim();
}

async function executeInSandbox(script: string): Promise<{
  stdout: string[];
  stderr: string[];
  error?: string;
}> {
  const sandbox = await Sandbox.create();

  try {
    const execution = await sandbox.runCode(script, { language: "js" });
    const stdout = execution.logs?.stdout || [];
    const stderr = execution.logs?.stderr || [];
    const error = execution.error
      ? `${execution.error.name}: ${execution.error.value}`
      : undefined;

    return { stdout, stderr, error };
  } finally {
    await sandbox.kill();
  }
}

function parseCodeTestResults(
  stdout: string[],
  stderr: string[],
  executionError?: string
): Omit<SimulationResult, "simulationType" | "generatedScript" | "analysis"> {
  const logs: string[] = [];
  let testsPassed = 0;
  let testsFailed = 0;
  let verdict: "SUCCESS" | "FAILURE" | "ERROR" = "ERROR";

  for (const line of stdout) {
    logs.push(line.trim());
    if (line.includes("[PASS]")) testsPassed++;
    else if (line.includes("[FAIL]")) testsFailed++;
    if (line.includes("VERDICT: SUCCESS")) verdict = "SUCCESS";
    else if (line.includes("VERDICT: FAILURE")) verdict = "FAILURE";
  }

  if (stderr.length > 0) {
    logs.push("--- STDERR ---");
    for (const line of stderr) logs.push(line.trim());
  }

  if (executionError) {
    logs.push("--- EXECUTION ERROR ---");
    logs.push(executionError);
    verdict = "ERROR";
  }

  if (verdict === "ERROR" && !executionError) {
    if (testsFailed === 0 && testsPassed > 0) verdict = "SUCCESS";
    else if (testsFailed > 0) verdict = "FAILURE";
  }

  return { success: verdict === "SUCCESS", logs, error: executionError, testsPassed, testsFailed, verdict };
}

// ============================================================================
// STEP 2B: Theoretical validation (Mistral as peer reviewer)
// ============================================================================

const THEORETICAL_REVIEW_PROMPT = `You are a senior engineering peer reviewer. Analyze whether the proposed solution adequately addresses the stated problem.

Your response MUST use this EXACT format. Each line MUST start with the prefix in brackets followed by substantive analysis. Do NOT output just the label — you MUST include your actual assessment after the dash.

[REVIEW] <your opening analysis of the solution — 1-2 sentences summarizing your overall take>
[CHECK] Problem Understanding — <your assessment of whether the solution shows understanding of the root cause, with specific reasoning>
[CHECK] Completeness — <your assessment of whether all aspects of the problem are addressed, noting any gaps>
[CHECK] Correctness — <your assessment of technical soundness, citing specific parts of the solution>
[CHECK] Practicality — <your assessment of whether the solution is implementable and realistic>
[CHECK] Edge Cases — <your assessment of whether edge cases and limitations are considered>
[STRENGTH] <describe a specific strength of the solution with explanation>
[STRENGTH] <describe another strength if applicable>
[CONCERN] <describe a specific concern or gap, only if issues exist — omit this line if none>
[RESULT] Summary: X/5 checks passed, Y concerns raised
[VERDICT] SUCCESS or FAILURE

CRITICAL RULES:
- Every line MUST have substantive content after the prefix — never output just a label like "[CHECK] Completeness" alone
- Each [CHECK] line must contain your actual analysis, not just the check name
- Each [STRENGTH] must describe WHAT is strong and WHY
- Each [CONCERN] must describe the specific issue found
- [RESULT] must have actual counts
- [VERDICT] must be exactly SUCCESS or FAILURE
- Be rigorous but fair. A good theoretical solution should demonstrate clear understanding and logical reasoning.`;

async function performTheoreticalReview(
  mistral: Mistral,
  problem: string,
  solution: string,
  title: string,
  category: string
): Promise<{ logs: string[]; verdict: "SUCCESS" | "FAILURE"; analysis: string; checksPassed: number; concerns: number }> {
  const response = await mistral.chat.complete({
    model: "ministral-14b-2512",
    messages: [
      { role: "system", content: THEORETICAL_REVIEW_PROMPT },
      {
        role: "user",
        content: `CATEGORY: ${category}\nTITLE: ${title}\n\nPROBLEM:\n${problem}\n\nPROPOSED SOLUTION:\n${solution}\n\nProvide your peer review.`,
      },
    ],
    temperature: 0.2,
    maxTokens: 1500,
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Failed to get review from Mistral");
  }

  const analysis = content.trim();

  // Parse lines, merging continuation lines (no prefix) into the previous prefixed line
  const prefixPattern = /^\[(REVIEW|CHECK|STRENGTH|CONCERN|RESULT|VERDICT)\]/;
  const rawLines = analysis.split("\n").filter((line) => line.trim());
  const logs: string[] = [];
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (prefixPattern.test(trimmed)) {
      logs.push(trimmed);
    } else if (logs.length > 0) {
      // Continuation of previous prefixed line — append
      logs[logs.length - 1] += " " + trimmed;
    } else {
      // Leading unprefixed line — keep as-is
      logs.push(trimmed);
    }
  }

  // Count checks and concerns
  const checksPassed = (analysis.match(/\[CHECK\]/g) || []).length;
  const concerns = (analysis.match(/\[CONCERN\]/g) || []).length;

  // Determine verdict
  let verdict: "SUCCESS" | "FAILURE" = "FAILURE";
  if (analysis.includes("[VERDICT] SUCCESS") || analysis.toUpperCase().includes("VERDICT: SUCCESS")) {
    verdict = "SUCCESS";
  }

  return { logs, verdict, analysis, checksPassed, concerns };
}

// ============================================================================
// Main Handler
// ============================================================================

async function handler(request: NextRequest): Promise<NextResponse<unknown>> {
  try {
    const body: SimulateRequest = await request.json();
    const { knowledgeId, title, problem, solution, category } = body;

    if (!problem || !solution) {
      return NextResponse.json(
        { error: "Missing required fields: problem and solution" },
        { status: 400 }
      );
    }

    const mistralApiKey = process.env.MISTRAL_API_KEY;
    const e2bApiKey = process.env.E2B_API_KEY;

    if (!mistralApiKey) {
      return NextResponse.json({ error: "MISTRAL_API_KEY not configured" }, { status: 500 });
    }

    const mistral = new Mistral({ apiKey: mistralApiKey });

    // Step 1: Classify the solution type
    const simulationType = await classifySolution(mistral, problem, solution);
    console.log(`[simulate] Type: ${simulationType} for ${knowledgeId}`);

    if (simulationType === "code") {
      // Code-based: generate tests and run in sandbox
      if (!e2bApiKey) {
        return NextResponse.json({ error: "E2B_API_KEY not configured" }, { status: 500 });
      }

      const testScript = await generateTestScript(mistral, problem, solution, title || "Unknown", category || "General");
      const { stdout, stderr, error } = await executeInSandbox(testScript);
      const result = parseCodeTestResults(stdout, stderr, error);

      return NextResponse.json({
        knowledgeId,
        simulationType: "code",
        ...result,
        generatedScript: testScript,
      });
    } else {
      // Theoretical: peer review with Mistral
      const review = await performTheoreticalReview(mistral, problem, solution, title || "Unknown", category || "General");

      return NextResponse.json({
        knowledgeId,
        simulationType: "theoretical",
        success: review.verdict === "SUCCESS",
        logs: review.logs,
        verdict: review.verdict,
        testsPassed: review.checksPassed,
        testsFailed: review.concerns,
        analysis: review.analysis,
      });
    }
  } catch (error) {
    console.error("Simulation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        logs: [`Simulation failed: ${errorMessage}`],
        error: errorMessage,
        testsPassed: 0,
        testsFailed: 0,
        verdict: "ERROR" as const,
        simulationType: "code" as const,
      },
      { status: 500 }
    );
  }
}

// Wrap with x402 payment protection
export const POST = withX402(handler, simulateRouteConfig, resourceServer);
