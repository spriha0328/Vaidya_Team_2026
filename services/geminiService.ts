import { GoogleGenAI, Content, Part } from "@google/genai";
import { Message, LocationData, GroundingMetadata } from "../types";
import { maskPII, logAuditEvent } from "./utils";

const SYSTEM_PROMPT = `
You are PriMed AI, a highly secure, specialized Medical Triage and Mental Health Assistant.

*** CRITICAL PROTOCOLS - READ CAREFULLY ***

1. TRUSTED INFORMATION & GROUNDING (GOOGLE TECH):
   - You have access to GOOGLE SEARCH and GOOGLE MAPS.
   - **Drug Interactions**: ALWAYS use Google Search to verify interactions between medications. Do not rely solely on internal knowledge.
   - **Finding Specialists**: ALWAYS use Google Maps to find real clinics, hospitals, or doctors when asked.
   - **Citations**: The system will automatically display your sources. You do not need to manually paste URLs, but you should reference "According to search results..."

2. RESPONSE FORMATTING (STRICTLY ENFORCED):
   - **DEFAULT MODE (Concise)**: You MUST use short, bulleted lists. Each point should be 1-2 sentences maximum.
   - **DETAILED MODE**: Use longer paragraphs ONLY if the user explicitly asks for "explanation", "details", or "history".
   - **Example Structure**:
     * Direct Answer (1 sentence)
     * Key Point A
     * Key Point B
     * Recommendation

3. SAFETY & TRIAGE:
   - **Severity Check**:
     * LOW: General info.
     * HIGH/CRITICAL: Chest pain, stroke, suicide ideation. -> ACTION: Display "⚠️ EMERGENCY: Call 911/112."
   - **Medical Disclaimer**: You are an AI, not a doctor.

4. PERSONAS:
   - **Medical Analyst** (Default): Clinical, precise, objective.
   - **Empathetic Counselor** (Mental Health): Warm, validating, slow-paced.

5. PRIVACY:
   - Do not repeat PII (names/numbers) in your output.

6. LANGUAGE & REGIONAL SUPPORT:
   - **Language Detection**: Automatically detect the language of the user's query (e.g., Spanish, Hindi, French, Arabic, etc.).
   - **Response Language**: You MUST reply in the SAME language as the user.
   - **Regional Context**: When suggesting doctors or clinics (via Maps), prioritize the location context provided or implied by the language if explicit location data is missing.
`;

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  attachment?: { mimeType: string; data: string },
  userLocation?: LocationData
): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. PII Masking
  const cleanPrompt = maskPII(newMessage);
  logAuditEvent("DATA_PROCESSING", "PII Masking applied");

  // 2. Prepare History
  const apiHistory: Content[] = history
    .filter(m => !m.isError)
    .map(m => {
      // Ensure we strip the data URI prefix if present (e.g. data:image/png;base64,...)
      // This is necessary because App.tsx stores the full data URI for display, 
      // but the API expects raw base64.
      const parts: Part[] = [];
      if (m.attachment) {
        const cleanData = m.attachment.data.includes(',') 
          ? m.attachment.data.split(',')[1] 
          : m.attachment.data;
          
        parts.push({ 
          inlineData: { mimeType: m.attachment.mimeType, data: cleanData } 
        });
        parts.push({ text: m.content });
      } else {
        parts.push({ text: m.content });
      }
      
      return {
        role: m.role,
        parts: parts
      };
    });

  try {
    // 3. Construct Message
    const currentParts: Part[] = [{ text: cleanPrompt }];
    if (attachment) {
      currentParts.unshift({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data
        }
      });
      logAuditEvent("FILE_UPLOAD", "Attachment processed");
    }

    // 4. Configure Tools (Google Search + Maps)
    // We use gemini-2.5-flash as it supports both Maps and Search simultaneously
    // IMPORTANT: Do NOT add empty functionCallingConfig here if we only use Google Tools.
    const tools: any[] = [
      { googleSearch: {} },
      { googleMaps: {} }
    ];

    // Configure Maps Grounding if location is available
    let toolConfig: any = undefined;
    if (userLocation) {
      toolConfig = {
        googleMaps: {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            }
          }
        }
      };
    }

    const chat = ai.chats.create({
      model: "gemini-2.5-flash", 
      history: apiHistory,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: tools,
        toolConfig: toolConfig,
        temperature: 0.3,
      },
    });

    // 5. Send Message
    const response = await chat.sendMessage({
      message: currentParts
    });

    // 6. Extract Response & Grounding Data
    const text = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata as unknown as GroundingMetadata;

    if (!text) throw new Error("No response generated.");
    
    return { text, groundingMetadata };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    logAuditEvent("API_ERROR", error.message || "Unknown error");
    throw new Error("I encountered an issue connecting to the secure medical triage server. Please try again.");
  }
};