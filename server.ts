import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initializer for Gemini API
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

// 1. Scraping & Formatting HTML helper
function cleanHtml(html: string): string {
  let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "");
  text = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "");
  text = text.replace(/<!--([\s\S]*?)-->/g, "");
  text = text.replace(/<svg[^>]*>([\s\S]*?)<\/svg>/gi, "");
  text = text.replace(/<head[^>]*>([\s\S]*?)<\/head>/gi, "");
  // Strip massive layout tags' attribute clutter to minimize token usage
  text = text.replace(/\s(class|id|style|data-[a-z0-9-]+)="[^"]*"/gi, "");
  return text.trim();
}

// 2. SCRAPE & CREATE Endpoint
app.post("/api/create", async (req, res) => {
  const { url, includeMcp = false, customInstructions = "" } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const targetUrl = String(url).trim();
    let scrapedContent = "";
    let methodUsed = "Jina Reader Markdown API";

    let extractionSuccess = false;

    // A. Attempt Jina Reader API first (clean, optimized, free markdown extraction)
    try {
      const jinaUrl = `https://r.jina.ai/${targetUrl}`;
      console.log(`Attempting Jina Reader markdown extraction for URL: ${jinaUrl}`);
      const response = await fetch(jinaUrl, {
        headers: {
          "Accept": "text/plain, text/markdown, */*",
        },
      });

      if (response.ok) {
        const markdownText = await response.text();
        if (markdownText && markdownText.trim().length > 100) {
          scrapedContent = markdownText.trim();
          console.log("Successfully extracted markdown via Jina Reader. Length:", scrapedContent.length);
          extractionSuccess = true;
        } else {
          throw new Error("Jina Reader returned empty or extremely short content.");
        }
      } else {
        throw new Error(`Jina Reader returned status ${response.status}`);
      }
    } catch (jinaErr: any) {
      console.warn(`Jina Reader markdown extraction failed. Error: ${jinaErr.message || jinaErr}`);
    }

    // B. Direct HTML Scraper Fallback if Jina fails
    if (!extractionSuccess) {
      methodUsed = "Direct HTML Scraper (Fallback)";
      try {
        console.log(`Attempting direct HTML crawl for URL: ${targetUrl}`);
        // Fallback: direct fetch
        const response = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          },
        });
        if (!response.ok) {
          throw new Error(`Direct fetch status ${response.status}`);
        }
        const rawHtml = await response.text();
        scrapedContent = cleanHtml(rawHtml);
        console.log("Successfully crawled HTML directly. Length:", scrapedContent.length);
      } catch (scrapeErr: any) {
        console.warn("Direct HTML scraping fallback failed as well:", scrapeErr.message || scrapeErr);
        methodUsed = "Model Knowledge Base (Ultimate Fallback)";
        scrapedContent = `[Note: Direct fetch and Simplescraper both failed due to anti-scraping blocks or network limits. Please use your pre-trained expertise and internal knowledge of the API and documentation for the target URL: ${targetUrl} to design and create a completely functional and highly detailed Skill directory.]`;
      }
    }

    const cleanedContent = scrapedContent.substring(0, 100000); // limit payload size safely

    // B. Call Gemini to distill scraped HTML into beautifully structured markdown and create the Skill Card
    const ai = getAI();

    const createPrompt = `
You are the "Quicks" expert agent. Your goal is to receive structured HTML/Text/Markdown content (scraped via ${methodUsed}) from a tool's documentation URL and output a complete, fully-implemented Skill Directory in JSON according to the agentskills.io format.

URL Source: ${url}
Cleaned Documentation Input:
${cleanedContent}

Additional user customization/instructions:
${customInstructions || "None"}

Please create a modular, highly effective Skill according to these standards:
- It MUST include "SKILL.md" with valid YAML frontmatter (fields: name, description, majorCapabilities, requestFramePermissions, etc.)
- It MUST include a "scripts/validate.js" file containing robust Node.js validation / test code verifying the skill's capabilities (e.g. simulated mock runs).
- It MUST include a "references/source.md" file capturing the key documentation notes, tables, schemas, or instructions.
${includeMcp ? `- It MUST include "mcp-server.json" configuring a Model Context Protocol server block for instant client integration.` : ""}

ADHERE TO:
- agentskills.io specification style.
- Descriptions should be concise (< 1024 characters).
- Maintain rigorous, functional code in files, no placeholders.

Ensure the files dictionary has:
1. "SKILL.md"
2. "scripts/validate.js"
3. "references/source.md"
${includeMcp ? `4. "mcp-server.json"` : ""}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: createPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            folderName: {
              type: Type.STRING,
              description: "Lowercase, dash-separated folder name (e.g., github-api-skill)",
            },
            displayName: {
              type: Type.STRING,
              description: "Human-friendly, high-contrast title (e.g., GitHub API Skill)",
            },
            description: {
              type: Type.STRING,
              description: "A short, concise description (< 1000 characters) explaining what the skill triggers or does.",
            },
            files: {
              type: Type.OBJECT,
              properties: {
                "SKILL.md": { type: Type.STRING },
                "scripts/validate.js": { type: Type.STRING },
                "references/source.md": { type: Type.STRING },
                "mcp-server.json": { type: Type.STRING },
              },
              additionalProperties: { type: Type.STRING },
              required: ["SKILL.md", "scripts/validate.js", "references/source.md"],
            },
          },
          required: ["folderName", "displayName", "description", "files"],
        },
      },
    });

    const parsedData = JSON.parse(result.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Creation failed:", error);
    return res.status(500).json({ error: error.message || "An error occurred during skill creation." });
  }
});

// 3. Subagent Skill Registration & Deployment Endpoints (Evaluation & Evals Lab)

app.post("/api/evaluate", async (req, res) => {
  const { prompt, skillContent, assertions = [] } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Test prompt is required" });
  }

  try {
    const ai = getAI();

    // A. Baseline Run (Without Skill Guidelines)
    const startTimeBaseline = Date.now();
    const baselineResult = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a helpful assistant. Solve the following task directly:\n\n${prompt}`,
    });
    const durationBaseline = Date.now() - startTimeBaseline;
    const baselineOutput = baselineResult.text || "No output generated.";
    
    // Estimate baseline tokens (approximate word count * 1.3 or use metadata if available)
    const baselineTokens = Math.ceil(baselineOutput.split(/\s+/).length * 1.45) + 30;

    // B. With-Skill Run (Guided by SKILL.md guidelines)
    const startTimeSkill = Date.now();
    const withSkillResult = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert agent powered by custom guidelines.
Here are your operational rules, triggers, and instructions (SKILL.md):
${skillContent}

Now, execute the following task strictly following these guidelines:
${prompt}`,
    });
    const durationSkill = Date.now() - startTimeSkill;
    const withSkillOutput = withSkillResult.text || "No output generated.";

    // Estimate with-skill tokens
    const withSkillTokens = Math.ceil(withSkillOutput.split(/\s+/).length * 1.45) + Math.ceil(skillContent.split(/\s+/).length * 1.45) + 50;

    // C. Evaluate assertions if provided
    let baselineGrades: Array<{ assertion: string; passed: boolean; evidence: string }> = [];
    let withSkillGrades: Array<{ assertion: string; passed: boolean; evidence: string }> = [];

    if (assertions.length > 0) {
      // Grade Baseline
      const gradeBaselinePrompt = `
You are an objective expert agent evaluator acting as a skill-testing grader. Your evaluation follows the rigorous, high-threshold Skill Creator guidelines:
- Evaluate outputs both qualitatively and quantitatively.
- Focus on objective verification of assertions and provide clear evidence.
- Grade strictly to ensure the skill meets the threshold of correctness and usability.
- Explain the "why" in your evidence; don't just output generic messages. Try hard to understand the task deeply and provide high-fidelity reasons for the grade.

Task Prompt:
"${prompt}"

Output to evaluate:
"""
${baselineOutput}
"""

Assertions:
${assertions.map((a: string, i: number) => `${i + 1}. ${a}`).join("\n")}

Your output MUST be a JSON array of objects with keys "passed" (boolean) and "evidence" (string) corresponding to each assertion in order. No extra markup, markdown blocks, or commentary.
`;
      try {
        const gradeRes = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: gradeBaselinePrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  passed: { type: Type.BOOLEAN },
                  evidence: { type: Type.STRING },
                },
                required: ["passed", "evidence"],
              },
            },
          },
        });
        const parsedGrades = JSON.parse(gradeRes.text || "[]");
        baselineGrades = assertions.map((assertion: string, i: number) => ({
          assertion,
          passed: !!parsedGrades[i]?.passed,
          evidence: parsedGrades[i]?.evidence || "No verification evidence returned.",
        }));
      } catch (err) {
        console.error("Baseline grading failed:", err);
        baselineGrades = assertions.map((assertion: string) => ({
          assertion,
          passed: false,
          evidence: "Evaluation service failed during assertion grading.",
        }));
      }

      // Grade With-Skill
      const gradeWithSkillPrompt = `
You are an objective expert agent evaluator acting as a skill-testing grader. Your evaluation follows the rigorous, high-threshold Skill Creator guidelines:
- Evaluate outputs both qualitatively and quantitatively.
- Focus on objective verification of assertions and provide clear evidence.
- Grade strictly to ensure the skill meets the threshold of correctness and usability.
- Explain the "why" in your evidence; don't just output generic messages. Try hard to understand the task deeply and provide high-fidelity reasons for the grade.

Task Prompt:
"${prompt}"

Operational Skill Guidelines (SKILL.md) used:
"""
${skillContent}
"""

Output to evaluate (guided by operational rules):
"""
${withSkillOutput}
"""

Assertions:
${assertions.map((a: string, i: number) => `${i + 1}. ${a}`).join("\n")}

Your output MUST be a JSON array of objects with keys "passed" (boolean) and "evidence" (string) corresponding to each assertion in order. No extra markup, markdown blocks, or commentary.
`;
      try {
        const gradeRes = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: gradeWithSkillPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  passed: { type: Type.BOOLEAN },
                  evidence: { type: Type.STRING },
                },
                required: ["passed", "evidence"],
              },
            },
          },
        });
        const parsedGrades = JSON.parse(gradeRes.text || "[]");
        withSkillGrades = assertions.map((assertion: string, i: number) => ({
          assertion,
          passed: !!parsedGrades[i]?.passed,
          evidence: parsedGrades[i]?.evidence || "No verification evidence returned.",
        }));
      } catch (err) {
        console.error("With-skill grading failed:", err);
        withSkillGrades = assertions.map((assertion: string) => ({
          assertion,
          passed: false,
          evidence: "Evaluation service failed during assertion grading.",
        }));
      }
    }

    return res.json({
      baseline: {
        output: baselineOutput,
        duration_ms: durationBaseline,
        total_tokens: baselineTokens,
        grades: baselineGrades,
      },
      withSkill: {
        output: withSkillOutput,
        duration_ms: durationSkill,
        total_tokens: withSkillTokens,
        grades: withSkillGrades,
      }
    });

  } catch (error: any) {
    console.error("Evaluation failed:", error);
    return res.status(500).json({ error: error.message || "An error occurred during evaluation." });
  }
});

// Vite Middleware for Dev and production serving
const setupServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

setupServer();
