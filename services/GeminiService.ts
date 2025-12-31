
import { GoogleGenAI, Modality } from "@google/genai";

class GeminiService {
  private getClient() {
    // Fix: Using process.env.API_KEY directly as per the hard requirement guidelines
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  /**
   * Generates a grounded response stream. 
   * Uses Gemini 3 Flash for search-based queries and 2.5 Flash for Maps-based location queries.
   */
  async *generateStream(prompt: string, systemInstruction: string, imageBase64?: string, location?: {lat: number, lng: number}) {
    const ai = this.getClient();
    const parts: any[] = [{ text: prompt }];
    
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1] || imageBase64
        }
      });
    }

    const isLocationQuery = prompt.toLowerCase().includes('near') || prompt.toLowerCase().includes('where') || !!location;
    // Map grounding is supported in Gemini 2.5 series.
    const model = isLocationQuery ? 'gemini-2.5-flash' : 'gemini-3-flash-preview';
    const tools: any[] = isLocationQuery ? [{ googleMaps: {} }] : [{ googleSearch: {} }];
    
    const toolConfig = location ? {
      retrievalConfig: {
        latLng: {
          latitude: location.lat,
          longitude: location.lng
        }
      }
    } : undefined;

    const result = await ai.models.generateContentStream({
      model: model,
      contents: { parts },
      config: { 
        systemInstruction,
        tools: tools as any,
        toolConfig: toolConfig as any
      }
    });

    for await (const chunk of result) {
      yield {
        text: chunk.text || "",
        grounding: chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
    }
  }

  /**
   * High-quality Text-to-Speech using the native multimodal audio model.
   */
  async textToSpeech(text: string, voiceName: 'Kore' | 'Puck' | 'Charon' | 'Zephyr' | 'Fenrir' = 'Kore'): Promise<Uint8Array> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } }
        }
      }
    });

    const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Data) throw new Error("Audio generation failed");
    
    // Manual decode as per guidelines
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Decodes raw PCM data for standard AudioContext playback.
   */
  async decodePCM(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }
}

export const gemini = new GeminiService();
