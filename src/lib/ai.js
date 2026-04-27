import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

function getModel() {
  if (!GEMINI_API_KEY) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
  return model;
}

export const analyzeComplaintText = async (rawText) => {
  const aiModel = getModel();

  // If no API key, return a smart local fallback
  if (!aiModel) {
    const lower = rawText.toLowerCase();
    let category = "other";
    let urgency = "Medium";

    if (lower.match(/road|pothole|crack|street|footpath|pavement/)) category = "road";
    else if (lower.match(/garbage|waste|trash|dump|bin|litter/)) category = "garbage";
    else if (lower.match(/electric|light|power|wire|outage|streetlight/)) category = "electricity";
    else if (lower.match(/water|pipe|drain|flood|leak|sewage/)) category = "water";
    else if (lower.match(/accident|emergency|fire|danger|urgent/)) { category = "other"; urgency = "High"; }

    if (lower.match(/urgent|danger|emergency|immediately|critical|serious/)) urgency = "High";
    else if (lower.match(/minor|small|little|slight/)) urgency = "Low";

    return {
      category,
      urgency,
      structuredText: rawText.charAt(0).toUpperCase() + rawText.slice(1),
    };
  }

  const prompt = `You are an AI assistant that structures civic complaints for a Smart City Maintenance system.
Analyze the following complaint text and return a JSON object with exactly three keys:
1. "category": Must be one of ["road", "garbage", "electricity", "water", "accident", "other"].
2. "urgency": Must be one of ["Low", "Medium", "High"].
3. "structuredText": A clean, formal, and clear version of the complaint in 1-2 sentences.

Complaint text: "${rawText}"

Return ONLY valid JSON. No markdown, no backticks, no extra text.`;

  try {
    const result = await aiModel.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip any accidental markdown fences
    const jsonString = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(jsonString);

    if (!parsed.category || !parsed.urgency || !parsed.structuredText) {
      throw new Error("Missing required fields in JSON output");
    }

    return parsed;
  } catch (error) {
    console.error("Gemini AI Analysis failed:", error);
    throw new Error("Failed to analyze complaint with AI. Please try again.");
  }
};
