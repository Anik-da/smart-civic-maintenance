const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const MODEL_URL = 'https://api-inference.huggingface.co/models/google/gemma-1.1-2b-it';

export const analyzeComplaintText = async (rawText) => {
  const prompt = `<bos><start_of_turn>user
You are an AI assistant that structures civic complaints. 
Analyze the following complaint text and return a JSON object with exactly three keys:
1. "category": Must be one of ["road", "garbage", "electricity", "accident", "other"].
2. "urgency": Must be one of ["Low", "Medium", "High"].
3. "structuredText": A clean, formal, and clear version of the complaint.

Complaint text: "${rawText}"

Return ONLY valid JSON. Do not include any other text or markdown formatting.<end_of_turn>
<start_of_turn>model
{`;

  try {
    const response = await fetch(MODEL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.1,
          return_full_text: false,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    let generatedText = data[0].generated_text;
    
    // Because we prompt with `{`, the model might not include the opening brace.
    // Let's ensure it's a valid JSON string.
    let jsonString = '{' + generatedText;
    
    // Clean up any trailing markdown or text
    const endBraceIndex = jsonString.lastIndexOf('}');
    if (endBraceIndex !== -1) {
      jsonString = jsonString.substring(0, endBraceIndex + 1);
    }

    const parsed = JSON.parse(jsonString);
    
    // Basic validation
    if (!parsed.category || !parsed.urgency || !parsed.structuredText) {
      throw new Error("Missing required fields in JSON output");
    }

    return parsed;
  } catch (error) {
    console.error('AI Analysis failed:', error);
    throw new Error('Failed to analyze text using AI. Please try again.');
  }
};
