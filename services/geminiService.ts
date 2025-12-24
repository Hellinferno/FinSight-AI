import { GoogleGenAI, Type, Tool } from "@google/genai";
import { SearchResult, ResearchResponse } from "../types";
import { handleAPIError } from "../utils/errorHandler";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_FLASH = 'gemini-3-flash-preview';
const MAX_HISTORY_LENGTH = 20;

const financialTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "get_realtime_stock_data",
        description: "Get real-time stock price, market cap, and company profile. Accepts Ticker Symbols (AAPL) OR Company Names (Apple, Microsoft).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            ticker: { type: Type.STRING, description: "The ticker symbol OR company name (e.g. 'Apple', 'NVDA')." }
          },
          required: ["ticker"]
        }
      },
      {
        name: "compare_companies",
        description: "Compare financial performance (Revenue, Net Income) of multiple companies over 5 years.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            tickers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of tickers to compare (e.g. ['AAPL', 'MSFT', 'GOOG'])" }
          },
          required: ["tickers"]
        }
      }
    ]
  }
];

const trimHistory = (history: any[]): any[] => {
  if (history.length <= MAX_HISTORY_LENGTH) return history;
  return history.slice(-MAX_HISTORY_LENGTH);
};

export const GeminiService = {
  // ... existing methods (conductResearch, generateReport, analyzeDocument) keep same ... 
  // For brevity in this update, I'm just replacing startFinancialChat with the streaming version logic
  // but keeping other methods intact is assumed by the system.
  
  async conductResearch(query: string): Promise<ResearchResponse> {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: `Research: ${query}`,
        config: { tools: [{ googleSearch: {} }] },
      });
      const summary = response.text || "No summary generated.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: SearchResult[] = chunks.filter((c: any) => c.web?.uri).map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
      return { summary, sources: sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i) };
    } catch (error) { return handleAPIError(error, 'Gemini'); }
  },

  async generateReport(context: string): Promise<string> {
      try {
          const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: `Generate financial report from context: ${context}`
          });
          return response.text || "Failed.";
      } catch (e) { return "Error generating report."; }
  },

  async analyzeDocument(text: string, type: string): Promise<string> {
      try {
          const response = await ai.models.generateContent({
              model: MODEL_FLASH,
              contents: `Analyze (${type}): ${text.substring(0, 30000)}` // Safety truncate
          });
          return response.text || "Failed.";
      } catch (e) { return "Error analyzing."; }
  },

  /**
   * New Streaming Chat Implementation
   */
  async *streamFinancialChat(history: { role: string; text: string }[], message: string) {
    try {
      const trimmedHistory = trimHistory(history);
      const chat = ai.chats.create({
        model: MODEL_FLASH,
        config: {
          systemInstruction: "You are an expert Financial Analyst. Use tools for data. If using a tool, output the function call. If answering text, use Markdown.",
          tools: financialTools,
        },
        history: trimmedHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
      });

      const result = await chat.sendMessageStream({ message });
      
      for await (const chunk of result) {
        // We yield chunks as they come in. 
        // Note: Function calls usually come in the first chunk or aggregated, 
        // handling mixed stream/function calls requires checking chunk.functionCalls
        yield chunk;
      }
    } catch (error) {
      console.error("Stream Error", error);
      throw error;
    }
  },

  // Non-streaming fallback for tools loop (simplified for now)
  async sendToolResultToChat(history: any[], toolName: string, toolOutput: any): Promise<string> {
     const prompt = `[SYSTEM: TOOL OUTPUT] ${toolName}: ${JSON.stringify(toolOutput)} [/SYSTEM] Answer user request.`;
     const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: [...history.map((h:any) => ({ role: h.role, parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: prompt }] }]
     });
     return response.text || "Error";
  }
};