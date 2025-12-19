
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, TelegramGroup, SearchParams } from "../types";

export const searchTelegramGroups = async (params: SearchParams): Promise<SearchResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const isUserSearch = params.searchType === 'user';

  const systemInstruction = `أنت وحدة الاستخبارات المركزية "SCOUT OPS". 
  مهمتك: رصد واعتراض روابط WhatsApp و Telegram بدقة عالية.
  
  بروتوكول البحث:
  1. روابط WhatsApp: ابحث عن chat.whatsapp.com.
  2. روابط Telegram: ابحث عن t.me/joinchat أو t.me/+.
  3. المنصات: قم بمسح X, LinkedIn, TikTok, Instagram والمنتديات.
  
  المخرجات يجب أن تكون JSON حصراً وتتضمن:
  - تحليل موجز (Analysis).
  - قائمة المجموعات (Groups) مع تحديد المنصة المصدر ونوع الرابط.
  - مستوى الخطر (Risk Level).`;

  const prompt = isUserSearch 
    ? `أجرِ فحصاً استخباراتياً للمعرف "${params.query}" عبر السوشيال ميديا. استخرج أي روابط مجموعات واتساب أو تليجرام مرتبطة.`
    : `اعترض روابط مجموعات واتساب وتليجرام النشطة المتعلقة بـ "${params.query}" من X و TikTok و LinkedIn.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            groups: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  url: { type: Type.STRING },
                  isPrivate: { type: Type.BOOLEAN },
                  isProfessional: { type: Type.BOOLEAN },
                  category: { type: Type.STRING },
                  platformSource: { type: Type.STRING },
                  linkType: { type: Type.STRING, enum: ["Telegram", "WhatsApp"] },
                  confidenceScore: { type: Type.NUMBER }
                },
                required: ["title", "description", "url", "isPrivate", "isProfessional", "category", "platformSource", "linkType", "confidenceScore"]
              }
            },
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
          },
          required: ["analysis", "groups", "riskLevel"]
        }
      },
    });

    const resultData = JSON.parse(response.text);
    
    // استخراج المصادر الحقيقية من Google Search Grounding
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = (groundingChunks as any[])
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: String(chunk.web.title || 'مصدر خارجي'),
        uri: String(chunk.web.uri || '#'),
      }));

    const parsedGroups: TelegramGroup[] = resultData.groups.map((g: any) => ({
      ...g,
      id: `intel-${Math.random().toString(36).substr(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('ar-EG'),
    }));

    return { 
      text: resultData.analysis,
      sources, 
      parsedGroups,
      summary: {
        totalDetected: parsedGroups.length,
        privateRatio: "N/A",
        riskLevel: resultData.riskLevel
      }
    };
  } catch (error) {
    console.error("Critical Failure:", error);
    throw error;
  }
};
