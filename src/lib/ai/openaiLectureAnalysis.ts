import { OpenAI } from "openai";

export interface LectureAnalysisResponse {
  summary: string;
  key_points: string[];
  discussion_topics: string[];
  exam_prompts: string[];
  glossary: Array<{ term: string; definition: string }>;
  engagement_hooks: string[];
  exam_signals: {
    signal_strength: number;
    signals: Array<{
      topic: string;
      why_it_matters: string;
      likely_exam_angles: string[];
    }>;
  };
}

/**
 * Analyzes a lecture transcript using OpenAI's GPT models.
 * Returns a structured JSON object with summaries, key points, and exam signals.
 */
export async function analyzeLectureWithOpenAI(params: {
  transcript: string;
  title: string;
  moduleCode?: string;
  moduleName?: string;
  lecturerName?: string;
  lectureDate?: string;
}): Promise<LectureAnalysisResponse> {
  const {
    transcript,
    title,
    moduleCode,
    moduleName,
    lecturerName,
    lectureDate,
  } = params;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  console.log(`[openaiLectureAnalysis] Using model: ${model}`);

  const systemPrompt =
    "You are a legal education AI agent that analyzes lectures and provides structured study materials in JSON format.";

  const userPrompt = `You are an expert law tutor analyzing a lecture transcript for a Durham University law student.

**Lecture Details:**
- Title: ${title}
- Module: ${moduleCode || "N/A"} ${moduleName ? `(${moduleName})` : ""}
- Lecturer: ${lecturerName || "N/A"}
- Date: ${lectureDate || "N/A"}

**Transcript:**
${transcript.substring(0, 40000)} ${transcript.length > 40000 ? "... (truncated)" : ""}

**Task:** Generate a comprehensive analysis of the provided lecture transcript.`;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "caseway_lecture_analysis_v1",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "summary",
              "key_points",
              "discussion_topics",
              "exam_prompts",
              "glossary",
              "engagement_hooks",
              "exam_signals",
            ],
            properties: {
              summary: {
                type: "string",
                minLength: 120,
                description:
                  "A clear, student-friendly lecture summary in plain English.",
              },
              key_points: {
                type: "array",
                minItems: 6,
                maxItems: 18,
                items: { type: "string", minLength: 20 },
                description: "Bullet-style key takeaways.",
              },
              discussion_topics: {
                type: "array",
                minItems: 4,
                maxItems: 12,
                items: { type: "string", minLength: 15 },
                description:
                  "Tutorial/seminar discussion questions or prompts.",
              },
              exam_prompts: {
                type: "array",
                minItems: 4,
                maxItems: 10,
                items: { type: "string", minLength: 20 },
                description: "Exam-style prompts (problem + essay mix).",
              },
              glossary: {
                type: "array",
                minItems: 6,
                maxItems: 30,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["term", "definition"],
                  properties: {
                    term: { type: "string", minLength: 2, maxLength: 80 },
                    definition: {
                      type: "string",
                      minLength: 20,
                      maxLength: 320,
                    },
                  },
                },
                description: "Key terms and definitions.",
              },
              engagement_hooks: {
                type: "array",
                minItems: 3,
                maxItems: 10,
                items: { type: "string", minLength: 15, maxLength: 140 },
                description:
                  "Short memorable hooks, mnemonics, contrasts, or analogies to aid recall.",
              },
              exam_signals: {
                type: "object",
                additionalProperties: false,
                required: ["signal_strength", "signals"],
                properties: {
                  signal_strength: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                    description:
                      "How exam-relevant the lecture is overall (0-100).",
                  },
                  signals: {
                    type: "array",
                    minItems: 4,
                    maxItems: 16,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: [
                        "topic",
                        "why_it_matters",
                        "likely_exam_angles",
                      ],
                      properties: {
                        topic: { type: "string", minLength: 8, maxLength: 120 },
                        why_it_matters: {
                          type: "string",
                          minLength: 30,
                          maxLength: 280,
                        },
                        likely_exam_angles: {
                          type: "array",
                          minItems: 2,
                          maxItems: 6,
                          items: {
                            type: "string",
                            minLength: 15,
                            maxLength: 160,
                          },
                        },
                      },
                    },
                    description: "Structured exam signals per topic.",
                  },
                },
              },
            },
          },
        },
      },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    return JSON.parse(content) as LectureAnalysisResponse;
  } catch (error: any) {
    console.error("[openaiLectureAnalysis] Error:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse OpenAI response as JSON");
    }
    throw error;
  }
}
