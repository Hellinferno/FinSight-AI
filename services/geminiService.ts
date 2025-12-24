import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SearchResult, ResearchResponse } from "../types";

const apiKey = process.env.API_KEY || '';
// Initialize safe client, handle missing key gracefully in UI
const ai = new GoogleGenAI({ apiKey });

const MODEL_FLASH = 'gemini-3-flash-preview';
// const MODEL_PRO = 'gemini-3-pro-preview'; // Use if complex reasoning needed

export const GeminiService = {
  /**
   * Performs market research using Google Search Grounding.
   */
  async conductResearch(query: string): Promise<ResearchResponse> {
    if (!apiKey) throw new Error("API Key not found");

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: `Research the following topic for a financial analyst. Provide a concise executive summary emphasizing key financial indicators, trends, and risks. Topic: ${query}`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const summary = response.text || "No summary generated.";
      
      // Extract grounding chunks for sources
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: SearchResult[] = chunks
        .filter((c: any) => c.web?.uri && c.web?.title)
        .map((c: any) => ({
          title: c.web.title,
          uri: c.web.uri,
        }));

      // Remove duplicates based on URI
      const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);

      return { summary, sources: uniqueSources };

    } catch (error) {
      console.error("Gemini Search Error:", error);
      throw error;
    }
  },

  /**
   * Ad-hoc financial analysis chat.
   */
  async analyzeFinancialQuery(history: { role: string; text: string }[], message: string): Promise<string> {
    if (!apiKey) throw new Error("API Key not found");

    try {
        const chat = ai.chats.create({
            model: MODEL_FLASH,
            config: {
                systemInstruction: "You are an expert Financial Analyst Assistant. You help with financial modeling, variance analysis, accounting questions, and strategic planning. Be precise, use financial terminology correctly, and keep answers concise yet comprehensive.",
            },
            history: history.map(h => ({
                role: h.role,
                parts: [{ text: h.text }]
            }))
        });

        const result = await chat.sendMessage({ message });
        return result.text || "I could not generate a response.";
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        throw error;
    }
  },

  /**
   * Generates a narrative report for a dataset.
   */
  async generateReport(dataContext: string): Promise<string> {
     if (!apiKey) throw new Error("API Key not found");

     try {
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Generate a professional financial management report summary based on the following data context. Highlight variances, key wins, and risks. \n\n Context: ${dataContext}`
        });
        return response.text || "No report generated.";
     } catch (error) {
         console.error("Gemini Report Error:", error);
         throw error;
     }
  },

  /**
   * Analyzes unstructured documents (Transcripts, 10-K snippets).
   */
  async analyzeDocument(text: string, analysisType: 'summary' | 'sentiment' | 'risks' | 'guidance'): Promise<string> {
      if (!apiKey) throw new Error("API Key not found");

      let prompt = "";
      switch (analysisType) {
          case 'summary':
              prompt = "Summarize the following financial document into a structured Executive Brief. Highlight the main topic, key outcomes, and any major announcements.";
              break;
          case 'sentiment':
              prompt = "Perform a sentiment analysis on the following text. Identify the overall tone (Bullish/Bearish/Neutral) and extract specific phrases that indicate management confidence or concern.";
              break;
          case 'risks':
              prompt = "Extract and list the key risk factors, headwinds, or challenges mentioned in the following text. Format as a bulleted list.";
              break;
          case 'guidance':
              prompt = "Extract all forward-looking statements and financial guidance numbers (Revenue, EPS, Margins, etc.) from the text. Present them in a table format if possible.";
              break;
      }

      try {
          const response = await ai.models.generateContent({
              model: MODEL_FLASH,
              contents: `${prompt}\n\n--- DOCUMENT TEXT ---\n${text}`
          });
          return response.text || "Analysis failed.";
      } catch (error) {
          console.error("Gemini Document Analysis Error:", error);
          throw error;
      }
  }
};
