import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function test() {
  console.log("Testing API Key:", API_KEY);
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hi");
    console.log("Success! Response:", result.response.text());
  } catch (error) {
    console.error("Failed!", error.message);
    if (error.response) {
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

test();
