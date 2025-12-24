import { GoogleGenAI, Type, Tool } from "@google/genai";
import { SearchResult, ResearchResponse } from "../types";
import { handleAPIError } from "../utils/errorHandler";

// Initialize Gemini Client
// The API key is injected via vite.config.ts define: 'process.env.API_KEY'
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Use the stable preview model to avoid stuttering and 404 errors
const MODEL_FLASH = 'gemini-3-flash-preview';

// Maximum message history to send to avoid token limits
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
            ticker: {
              type: Type.STRING,
              description: "The ticker symbol OR company name (e.g. 'Apple', 'NVDA')."
            }
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
            tickers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of tickers to compare (e.g. ['AAPL', 'MSFT', 'GOOG'])"
            }
          },
          required: ["tickers"]
        }
      }
    ]
  }
];

// Helper to trim history
const trimHistory = (history: any[]): any[] => {
  if (history.length <= MAX_HISTORY_LENGTH) return history;
  return history.slice(-MAX_HISTORY_LENGTH);
};

export const GeminiService = {
  async conductResearch(query: string): Promise<ResearchResponse> {
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

      const uniqueSources = sources.filter((v, i, a) => 
        a.findIndex(t => t.uri === v.uri) === i
      );

      return { summary, sources: uniqueSources };
    } catch (error) {
      return handleAPIError(error, 'Gemini');
    }
  },

  async generateReport(dataContext: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: `Generate a professional financial management report summary based on the following data context. Highlight variances, key wins, and risks. \n\n Context: ${dataContext}`
      });
      return response.text || "No report generated.";
    } catch (error) {
      return handleAPIError(error, 'Gemini');
    }
  },

  async analyzeDocument(
    text: string, 
    analysisType: 'summary' | 'sentiment' | 'risks' | 'guidance'
  ): Promise<string> {
    const prompts = {
      summary: "Summarize the following financial document into a structured Executive Brief. Highlight the main topic, key outcomes, and any major announcements.",
      sentiment: "Perform a sentiment analysis on the following text. Identify the overall tone (Bullish/Bearish/Neutral) and extract specific phrases that indicate management confidence or concern.",
      risks: "Extract and list the key risk factors, headwinds, or challenges mentioned in the following text. Format as a bulleted list.",
      guidance: "Extract all forward-looking statements and financial guidance numbers (Revenue, EPS, Margins, etc.) from the text. Present them in a table format if possible."
    };

    try {
      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: `${prompts[analysisType]}\n\n--- DOCUMENT TEXT ---\n${text}`
      });
      return response.text || "Analysis failed.";
    } catch (error) {
      return handleAPIError(error, 'Gemini');
    }
  },

  async startFinancialChat(
    history: { role: string; text: string }[], 
    message: string
  ) {
    try {
      // Trim history to prevent token limit issues
      const trimmedHistory = trimHistory(history);

      const chat = ai.chats.create({
        model: MODEL_FLASH,
        config: {
          systemInstruction: "You are an expert Financial Analyst. You have access to real-time tools. If a user asks for stock data, prices, or company info, ALWAYS use the 'get_realtime_stock_data' tool. If a user asks to compare multiple companies, use the 'compare_companies' tool. Do not hallucinate prices. Return text in valid Markdown.",
          tools: financialTools,
        },
        history: trimmedHistory.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        }))
      });

      const response = await chat.sendMessage({ message });
      const call = response.functionCalls?.[0];

      if (call) {
        return {
          type: 'TOOL_CALL',
          functionName: call.name,
          args: call.args
        };
      }

      return {
        type: 'TEXT',
        text: response.text
      };
    } catch (error) {
      return handleAPIError(error, 'Gemini');
    }
  },

  async sendToolResultToChat(
    history: any[], 
    toolName: string, 
    toolOutput: any
  ): Promise<string> {
    try {
      const trimmedHistory = trimHistory(history);
      
      const prompt = `
[SYSTEM: TOOL OUTPUT]
Tool Name: ${toolName}
Result: ${JSON.stringify(toolOutput)}
[/SYSTEM]

Based on the tool output above, please answer the user's original request. Provide a professional financial summary.
`;
      
      const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: [
          ...trimmedHistory.map((h: any) => ({ 
            role: h.role, 
            parts: [{ text: h.text }] 
          })), 
          { role: 'user', parts: [{ text: prompt }] }
        ]
      });
      
      return response.text || "Unable to generate response.";
    } catch (error) {
      return handleAPIError(error, 'Gemini');
    }
  }
};