import { GoogleGenAI, Type, FunctionDeclaration, Tool } from "@google/genai";
import { SearchResult, ResearchResponse } from "../types";

// Safely access environment variables to prevent crash if import.meta.env is undefined
const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_FLASH = 'gemini-2.0-flash-exp'; // Using Flash 2.0 for better tool performance

// --- DEFINE TOOLS ---
const financialTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "get_realtime_stock_data",
        description: "Get real-time stock price, market cap, and company profile for a given ticker symbol.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            ticker: {
              type: Type.STRING,
              description: "The stock ticker symbol (e.g., AAPL, MSFT, TSLA)."
            }
          },
          required: ["ticker"]
        }
      }
    ]
  }
];

export const GeminiService = {
  /**
   * Performs market research using Google Search Grounding.
   */
  async conductResearch(query: string): Promise<ResearchResponse> {
    if (!apiKey) throw new Error("API Key not found in .env.local (VITE_GEMINI_API_KEY)");

    try {
      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: `Research the following topic for a financial analyst. Provide a concise executive summary emphasizing key financial indicators, trends, and risks. Topic: ${query}`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const summary = response.text || "No summary generated.";
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: SearchResult[] = chunks
        .filter((c: any) => c.web?.uri && c.web?.title)
        .map((c: any) => ({
          title: c.web.title,
          uri: c.web.uri,
        }));

      const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);

      return { summary, sources: uniqueSources };

    } catch (error) {
      console.error("Gemini Search Error:", error);
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
  },

  /**
   * NEW: The Agentic Chat Loop
   * This sends the user message AND the tool definitions to Gemini.
   */
  async startFinancialChat(history: { role: string; text: string }[], message: string) {
    if (!apiKey) throw new Error("API Key not found");

    const chat = ai.chats.create({
      model: MODEL_FLASH,
      config: {
        systemInstruction: "You are an expert Financial Analyst. You have access to real-time tools. If a user asks for stock data, prices, or company info, ALWAYS use the 'get_realtime_stock_data' tool. Do not hallucinate prices.",
        tools: financialTools, // <--- We give the AI the tools here
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    // Send the message. Gemini will reply with either TEXT or a FUNCTION CALL.
    const response = await chat.sendMessage({ message });
    
    // Check if Gemini wants to call a function
    const call = response.functionCalls?.[0];

    if (call) {
        return {
            type: 'TOOL_CALL',
            functionName: call.name,
            args: call.args
        };
    }

    // Otherwise, it's a normal text response
    return {
        type: 'TEXT',
        text: response.text
    };
  },

  /**
   * NEW: Send Tool Results back to Gemini
   * After we (the code) execute the tool, we feed the result back so Gemini can write the final answer.
   */
  async sendToolResultToChat(history: any[], toolName: string, toolOutput: any) {
      // Re-construct chat state (stateless for this phase, creating new context)
      const prompt = `
      [SYSTEM: TOOL OUTPUT]
      Tool Name: ${toolName}
      Result: ${JSON.stringify(toolOutput)}
      [/SYSTEM]
      
      Based on the tool output above, please answer the user's original request.
      `;
      
      const response = await ai.models.generateContent({
          model: MODEL_FLASH,
          contents: [...history.map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: prompt }] }]
      });
      
      return response.text;
  }
};