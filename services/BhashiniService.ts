
import { BhashiniConfig } from '../types';

class BhashiniService {
  private config: BhashiniConfig | null = null;
  private readonly COMPUTE_URL = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';

  setConfig(config: BhashiniConfig) {
    this.config = config;
  }

  get isConfigured(): boolean {
    return !!(this.config && this.config.apiKey && this.config.active);
  }

  private async request(payload: any) {
    if (!this.isConfigured) throw new Error("Bhashini service is not active or missing API keys.");

    const response = await fetch(this.COMPUTE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.config!.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || `Bhashini API error: ${response.status}`);
    }

    return response.json();
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    if (!text.trim()) return '';
    
    const payload = {
      pipelineTasks: [{
        taskType: "translation",
        config: {
          language: { sourceLanguage: sourceLang, targetLanguage: targetLang },
          serviceId: "ai4bharat/indictrans-v2-all-gpu--t4"
        }
      }],
      inputData: { input: [{ source: text }] }
    };

    const data = await this.request(payload);
    return data?.pipelineResponse?.[0]?.output?.[0]?.target || text;
  }

  async speechToText(base64Audio: string, languageCode: string): Promise<string> {
    const payload = {
      pipelineTasks: [{
        taskType: "asr",
        config: {
          language: { sourceLanguage: languageCode },
          serviceId: "ai4bharat/whisper-medium-en-hi--gpu--t4"
        }
      }],
      inputData: { audio: [{ audioContent: base64Audio }] }
    };

    const data = await this.request(payload);
    return data?.pipelineResponse?.[0]?.output?.[0]?.source || '';
  }

  async textToSpeech(text: string, languageCode: string): Promise<string> {
    const payload = {
      pipelineTasks: [
        {
          taskType: "tts",
          config: {
            language: { sourceLanguage: languageCode },
            serviceId: "ai4bharat/indic-tts-coqui-all--gpu--t4"
          }
        }
      ],
      inputData: { input: [{ source: text }] }
    };

    const data = await this.request(payload);
    // Bhashini TTS returns base64 audio content in the response structure
    const audioContent = data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
    if (!audioContent) throw new Error("No audio content returned from Bhashini");
    return audioContent;
  }
}

export const bhashini = new BhashiniService();
