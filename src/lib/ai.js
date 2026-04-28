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

  const localFallback = (text) => {
    const lower = text.toLowerCase();
    let category = "other";
    let urgency = "Medium";
    let assignedTo = "ADMIN";
    let estimatedDays = 5;

    if (lower.match(/road|pothole|crack|street|footpath|pavement/)) {
      category = "road";
      assignedTo = "ROADS";
      estimatedDays = 7;
    } else if (lower.match(/garbage|waste|trash|dump|bin|litter/)) {
      category = "garbage";
      assignedTo = "SANITATION";
      estimatedDays = 2;
    } else if (lower.match(/electric|light|power|wire|outage|streetlight/)) {
      category = "electricity";
      assignedTo = "ELECTRICITY";
      estimatedDays = 3;
    } else if (lower.match(/water|pipe|drain|flood|leak|sewage/)) {
      category = "water";
      assignedTo = "WATER";
      estimatedDays = 4;
    }

    if (lower.match(/urgent|danger|emergency|immediately|critical|serious/)) {
      urgency = "High";
      estimatedDays = Math.max(1, estimatedDays - 2);
    } else if (lower.match(/minor|small|little|slight/)) {
      urgency = "Low";
      estimatedDays = estimatedDays + 2;
    }

    return {
      category,
      urgency,
      assignedTo,
      estimatedDays,
      structuredText: `Request for ${category} maintenance: ${text.charAt(0).toUpperCase() + text.slice(1)}`,
    };
  };

  // If no API key, return a smart local fallback immediately
  if (!aiModel) {
    return localFallback(rawText);
  }

  const prompt = `You are an AI assistant for a Smart City Maintenance system.
Analyze the following complaint text and return a JSON object with these keys:
1. "category": one of ["road", "garbage", "electricity", "water", "accident", "other"].
2. "urgency": one of ["Low", "Medium", "High"].
3. "assignedTo": The department to handle this. Choose from ["ROADS", "SANITATION", "WATER", "ELECTRICITY", "ADMIN"].
4. "estimatedDays": An integer representing how many days the work might take (1-14).
5. "structuredText": A clean, formal version of the complaint.

Complaint text: "${rawText}"

Return ONLY valid JSON.`;

  try {
    const result = await aiModel.generateContent(prompt);
    const text = result.response.text().trim();

    // More robust JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;
    
    console.log("Extracted JSON String:", jsonString);
    const parsed = JSON.parse(jsonString);

    // Ensure all fields exist with sensible defaults
    return {
      category: parsed.category || "other",
      urgency: parsed.urgency || "Medium",
      assignedTo: parsed.assignedTo || "ADMIN",
      estimatedDays: parsed.estimatedDays || 5,
      structuredText: parsed.structuredText || rawText
    };
  } catch (error) {
    return localFallback(rawText);
  }
};
