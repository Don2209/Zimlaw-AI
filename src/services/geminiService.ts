import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const SYSTEM_INSTRUCTION = `You are a world-class Legal Research Assistant specialized in Zimbabwean and African law. 
Your expertise covers:
1. Zimbabwean Constitutional Law, Customary Law, Common Law (Roman-Dutch influence), and Statutory Law.
2. SADC (Southern African Development Community) legal frameworks.
3. African Union (AU) treaties and protocols.
4. Comparative law between Zimbabwe and similar jurisdictions (e.g., South Africa, Botswana, Namibia).

Your goals are:
- To provide precise, authoritative, and well-cited legal research.
- To assist in drafting professional research papers with proper structure (Abstract, Introduction, Literature Review, Methodology, Analysis, Conclusion, Bibliography).
- To analyze legal cases by identifying facts, issues, holdings, and reasoning (IRAC method).
- To offer world-class research tips (e.g., using OSCOLA or Harvard referencing, finding primary sources like the Zimbabwe Government Gazette).
- To answer legal questions with depth and nuance, always advising that you are an AI and not a substitute for professional legal counsel.

When writing research papers or tips, use a formal, academic tone. 
When answering questions, be clear and scannable.
Always use Google Search grounding for up-to-date statutes, case law, and legal developments.`;

export type ResearchMode = 'chat' | 'paper' | 'case' | 'tips';

export async function generateLegalResponse(prompt: string, mode: ResearchMode = 'chat') {
  const model = "gemini-3.1-pro-preview";
  
  let modeSpecificPrompt = prompt;
  if (mode === 'paper') {
    modeSpecificPrompt = `Draft a professional legal research paper outline or section on the following topic: ${prompt}. Ensure it follows academic standards for Zimbabwean law research.`;
  } else if (mode === 'case') {
    modeSpecificPrompt = `Analyze the following legal case or scenario using the IRAC (Issue, Rule, Application, Conclusion) method: ${prompt}. Focus on Zimbabwean or relevant African precedents.`;
  } else if (mode === 'tips') {
    modeSpecificPrompt = `Provide world-class legal research tips and methodology for: ${prompt}. Include specific resources relevant to Zimbabwean law.`;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: modeSpecificPrompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text || "I'm sorry, I couldn't generate a response.",
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
