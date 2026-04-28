import { GoogleGenerativeAI } from "@google/generative-ai";

const variations = [
  "AIzaSyBMLH0oYc5eNSCIWg8kIqKzQmhI44ExZUc", // Original guess
  "AIzaSyBMLH0oYc5eNSClWg8kIqKzQmhI44ExZUc", // l instead of I at pos 20
  "AIzaSyBMLH0oYc5eNSCIWg8klqKzQmhI44ExZUc", // l instead of I at pos 25
  "AIzaSyBMLH0oYc5eNSClWg8klqKzQmhI44ExZUc", // both l
  "AIzaSyBMLH0oYc5eNSCIWg8kIqKzQmhL44ExZUc", // L instead of I at pos 32
  "AIzaSyBMLH0oYc5eNSCIWg8klqKzQmhL44ExZUc", // combinations
  "AIzaSyBMLH0oYc5eNSCIWg8klqKzQmhI44ExZUc",
  "AIzaSyBMLH0oYc5eNSCIWg8klqKzQmhI44ExZUc"
];

async function test(key) {
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    await model.generateContent("Hi");
    return true;
  } catch (error) {
    return false;
  }
}

async function run() {
  for (const key of variations) {
    console.log(`Testing: ${key}`);
    const ok = await test(key);
    if (ok) {
      console.log(`SUCCESS! Valid Key: ${key}`);
      return;
    }
  }
  console.log("None of the variations worked.");
}

run();
