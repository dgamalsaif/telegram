
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, TelegramGroup, SearchParams } from "../types";

/**
 * دالة متقدمة لتحليل JSON تضمن استخراج البيانات حتى في حال وجود نصوص إضافية من النموذج
 */
const parseSafeJSON = (text: string): any => {
  try {
    let cleanText = text.trim();
    // البحث عن أول '[' أو '{' وآخر ']' أو '}'
    const jsonMatch = cleanText.match(/[\{\[].*[\}\]]/s);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parsing Error. Raw text:", text);
    throw new Error("فشل في تحليل الإشارة الاستخباراتية. يرجى إعادة المحاولة.");
  }
};

export const searchTelegramGroups = async (params: SearchParams): Promise<SearchResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const isUserSearch = params.searchType === 'user';

  // دمج سياق العميل في التعليمات البرمجية
  const agentSignature = params.agentContext?.isRegistered 
    ? `توقيع العميل: ${params.agentContext.agentName} | الرقم العملياتي: ${params.agentContext.operationalId}`
    : "طلب من عميل غير معروف (GUEST).";

  const systemInstruction = `أنت وحدة الذكاء الاستخباراتي "SCOUT OPS v4.0". مهمتك استخراج روابط التواصل (تليجرام، واتساب) المنشورة في الفضاء الرقمي.
  
  بروتوكول الفحص الحالي:
  - العميل النشط: ${agentSignature}
  - الدولة: ${params.country} | الفئة: ${params.category} | اللغة: ${params.language}
  
  قواعد الاشتباك الرقمي:
  1. روابط تليجرام: استخراج t.me/+ أو t.me/joinchat أو t.me/[name].
  2. روابط واتساب: استخراج chat.whatsapp.com/[id].
  3. تتبع المعرفات (Entity Tracking): إذا كان نوع البحث "user"، قم بمسح المنصات (X, LinkedIn, GitHub) لإيجاد روابط مجموعات مرتبطة بالمعرف "${params.query}".
  
  المخرجات: يجب أن تكون حصراً بتنسيق JSON وبناءً على المخطط المحدد.`;

  const prompt = isUserSearch 
    ? `أجرِ مسحاً استخباراتياً عميقاً للمعرف: "${params.query}". ابحث عن أي آثار رقمية أو مجموعات تواصل مرتبطة بهذا الكيان في منطقة ${params.country}.`
    : `استخرج روابط نشطة لمجموعات تواصل تتعلق بـ "${params.query}" في تصنيف "${params.category}" داخل "${params.country}".`;

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
            analysis: { type: Type.STRING, description: "تحليل موجز للنتائج." },
            groups: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  url: { type: Type.STRING },
                  isPrivate: { type: Type.BOOLEAN },
                  linkType: { type: Type.STRING, enum: ["Telegram", "WhatsApp"] },
                  platformSource: { type: Type.STRING },
                  confidenceScore: { type: Type.NUMBER }
                },
                required: ["title", "description", "url", "linkType", "confidenceScore", "platformSource"]
              }
            },
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
          },
          required: ["analysis", "groups", "riskLevel"]
        }
      },
    });

    const resultData = parseSafeJSON(response.text);
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = (groundingChunks as any[])
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: String(chunk.web.title || 'مصدر خارجي'),
        uri: String(chunk.web.uri || '#'),
      }));

    const parsedGroups: TelegramGroup[] = (resultData.groups || []).map((g: any) => ({
      ...g,
      id: `intel-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      isProfessional: g.confidenceScore > 80,
      category: params.category,
      country: params.country,
      language: params.language
    }));

    return { 
      text: resultData.analysis || "اكتمل تحليل الإشارات الرقمية بنجاح.",
      sources, 
      parsedGroups,
      summary: {
        totalDetected: parsedGroups.length,
        privateRatio: `${parsedGroups.filter(g => g.isPrivate).length}/${parsedGroups.length}`,
        riskLevel: resultData.riskLevel || "Low"
      }
    };
  } catch (error: any) {
    console.error("Critical System Failure:", error);
    throw error;
  }
};
