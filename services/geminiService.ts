
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, TelegramGroup, SearchParams, TelegramMessage } from "../types";

const parseSafeJSON = (text: string): any => {
  try {
    let cleanText = text.trim();
    const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parsing Error:", text);
    return { analysis: "فشل في تحليل هيكل البيانات.", groups: [], messages: [], riskLevel: "Low" };
  }
};

export const searchTelegramGroups = async (params: SearchParams): Promise<SearchResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const platformNames = params.platforms.map(p => p.name).join(', ');
  const isSynced = params.agentContext?.syncStatus === 'authorized';

  const systemInstruction = `أنت وحدة الاستخبارات "SCOUT OPS v7.2". 
مهمتك: العثور على روابط (مجموعات/سيرفرات) واعتراض (رسائل) نشطة مرتبطة بالأهداف.
حالة المزامنة: ${isSynced ? 'نشطة (MTProto Enabled)' : 'غير نشطة (OSINT Only)'}.

المنصات المستهدفة: [${platformNames}].
بما في ذلك دعم Discord: ابحث عن روابط السيرفرات (Invite) والقنوات.

يجب أن يتضمن الرد JSON بالهيكل التالي:
- analysis: ملخص استخباراتي.
- groups: مصفوفة من المجموعات/القنوات (العنوان، الوصف، الرابط، رابط المنشور، النوع، المنصة، الثقة، طريقة الانضمام).
- messages: مصفوفة من الرسائل المكتشفة (النص، المرسل، التاريخ، اسم المجموعة، الرابط).
- riskLevel: مستوى الخطر (Low, Medium, High).`;

  const prompt = params.searchType === 'user'
    ? `[TARGET RECON] تتبع المستهدف "${params.query}" في ${params.country}. ابحث عن نشاطه في: ${platformNames}.`
    : `[INTEL SCAN] مسح للموضوع: "${params.query}" في "${params.country}". ابحث عن مجموعات ورسائل في: ${platformNames}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
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
                  sourcePostUrl: { type: Type.STRING },
                  isPrivate: { type: Type.BOOLEAN },
                  linkType: { type: Type.STRING, enum: ["Telegram", "WhatsApp", "Discord"] },
                  platformSource: { type: Type.STRING },
                  confidenceScore: { type: Type.NUMBER },
                  joinMethod: { type: Type.STRING, enum: ["inviteLink", "username", "idSearch", "mention"] }
                },
                required: ["title", "description", "url", "linkType", "confidenceScore", "platformSource", "sourcePostUrl", "joinMethod"]
              }
            },
            messages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  sender: { type: Type.STRING },
                  date: { type: Type.STRING },
                  groupTitle: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ["text", "sender", "date", "groupTitle", "url"]
              }
            },
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
          },
          required: ["analysis", "groups", "messages", "riskLevel"]
        }
      },
    });

    const resultData = parseSafeJSON(response.text);
    const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as any[])
      ?.filter(chunk => chunk.web)
      .map(chunk => ({
        title: String(chunk.web.title || 'مصدر خارجي'),
        uri: String(chunk.web.uri || '#'),
      })) || [];

    const parsedGroups: TelegramGroup[] = (resultData.groups || []).map((g: any) => ({
      ...g,
      id: `intel-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      isProfessional: g.confidenceScore > 50,
    }));

    const parsedMessages: TelegramMessage[] = (resultData.messages || []).map((m: any) => ({
      ...m,
      id: `msg-${Math.random().toString(36).substring(2, 9)}`,
    }));

    return { 
      text: resultData.analysis || "تم الانتهاء من المسح بنجاح.",
      sources, 
      parsedGroups,
      messages: parsedMessages,
      summary: {
        totalDetected: parsedGroups.length + parsedMessages.length,
        privateRatio: `${parsedGroups.filter(g => g.isPrivate).length}/${parsedGroups.length}`,
        riskLevel: resultData.riskLevel || "Low"
      }
    };
  } catch (error: any) {
    console.error("Critical Engine Error:", error);
    throw new Error("فشل اعتراض الإشارات الرقمية.");
  }
};
