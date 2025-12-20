
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, IntelLink, SearchParams, PlatformType } from "../types";

const parseSafeJSON = (text: string): any => {
  try {
    let cleanText = text.trim();
    // Aggressive cleanup for markdown
    cleanText = cleanText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return null;
  }
};

/**
 * SCOUT OPS v7.5 ULTRA PRO | CORE INTELLIGENCE SERVICE
 * Specializing in high-accuracy link discovery and contextual OSINT.
 */
export const searchGlobalIntel = async (params: SearchParams): Promise<SearchResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  
  const queryBase = params.query.trim();
  const geoContext = [params.location, params.town, params.hospital, params.specialty]
    .filter(Boolean)
    .join(' ');
  
  // Advanced Platform Dorks for URL Discovery
  const platformVectors: Record<string, string> = {
    'Telegram': '(site:t.me OR site:telegram.me OR site:telegram.dog OR "t.me/+")',
    'WhatsApp': '(site:chat.whatsapp.com OR "wa.link" OR "chat.whatsapp")',
    'Discord': '(site:discord.gg OR site:discord.com/invite)',
    'Facebook': '(site:facebook.com/groups)',
    'LinkedIn': '(site:linkedin.com/groups OR site:linkedin.com/posts)',
    'Reddit': '(site:reddit.com/r)',
    'Instagram': '(site:instagram.com)',
    'X': '(site:x.com OR site:twitter.com)',
    'TikTok': '(site:tiktok.com)',
  };

  const targetPlatforms = params.platforms.length > 0 
    ? params.platforms 
    : ['Telegram', 'WhatsApp', 'LinkedIn', 'Reddit', 'Facebook'];

  const searchScope = targetPlatforms
    .map(p => platformVectors[p])
    .filter(Boolean)
    .join(' OR ');

  let specializedTerms = '';
  if (params.searchType === 'medical-recon') {
    specializedTerms = '("Board" OR "Residency" OR "PGY" OR "Fellowship" OR "Medical Group" OR "زمالة" OR "بورد")';
  } else if (params.searchType === 'mention-tracker') {
    specializedTerms = '(intext:"discussed in" OR intext:"join this" OR intext:"link")';
  }

  const searchVector = `(${searchScope}) ${specializedTerms} "${queryBase}" ${geoContext}`;

  const systemInstruction = `You are SCOUT OPS v7.5 Ultra Pro. Your primary directive is to locate and verify invite links and community nodes.

CRITICAL PROTOCOLS:
1. **Source Context**: Always identify WHERE the link was found (e.g., "Mentioned in a Dr. X post on LinkedIn").
2. **Link Verification**: Categorize links as 'Direct' (actual invite) or 'Mention' (a page talking about it).
3. **Accuracy**: If a link is for a private group or requires approval, mark isPrivate: true.
4. **Localization**: Identify the country/city/hospital context for every result.

Output strictly valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `[INITIATE_SCAN] TARGET: "${queryBase}" | VECTOR: ${searchVector}`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  url: { type: Type.STRING },
                  platform: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  isPrivate: { type: Type.BOOLEAN },
                  source: {
                    type: Type.OBJECT,
                    properties: { 
                      name: { type: Type.STRING }, 
                      uri: { type: Type.STRING }, 
                      type: { type: Type.STRING }, 
                      context: { type: Type.STRING } 
                    }
                  }
                }
              }
            },
            stats: {
              type: Type.OBJECT,
              properties: {
                totalFound: { type: Type.NUMBER },
                medicalMatches: { type: Type.NUMBER }
              }
            }
          }
        }
      },
    });

    const data = parseSafeJSON(response.text);
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Verified Link Layer from Grounding
    const verifiedLinks: IntelLink[] = grounding
      .filter((c: any) => c.web)
      .map((c: any, i: number) => {
        const url = c.web.uri || '';
        const isDirect = url.includes('t.me') || url.includes('chat.whatsapp') || url.includes('discord.gg');
        
        let platform: PlatformType = 'Telegram';
        if (url.includes('whatsapp')) platform = 'WhatsApp';
        else if (url.includes('reddit')) platform = 'Reddit';
        else if (url.includes('linkedin')) platform = 'LinkedIn';
        else if (url.includes('facebook')) platform = 'Facebook';
        else if (url.includes('discord')) platform = 'Discord';

        return {
          id: `node-${i}-${Date.now()}`,
          title: c.web.title || "Verified Signal",
          description: isDirect ? "Direct community access node." : `Contextual mention found on ${platform}.`,
          url,
          isPrivate: url.includes('join') || url.includes('invite'),
          isActive: true,
          platform,
          confidence: 95,
          location: { country: params.location, town: params.town },
          source: {
            name: c.web.title || "Web Signal",
            uri: url,
            type: isDirect ? 'Direct' : 'Mention',
            context: `Grounding verified link found on ${platform}`
          },
          timestamp: new Date().toISOString()
        };
      });

    // Deduplicate and Merge
    const aiLinks = (data?.links || []).map((l: any, i: number) => ({
      ...l,
      id: `ai-${i}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      location: { country: params.location, town: params.town }
    }));

    const allLinks = [...verifiedLinks];
    const seenUrls = new Set(verifiedLinks.map(v => v.url.toLowerCase()));

    aiLinks.forEach((al: any) => {
      if (!seenUrls.has(al.url.toLowerCase())) {
        allLinks.push(al);
      }
    });

    return {
      analysis: data?.analysis || "Reconnaissance scan complete. Signals synchronized.",
      links: allLinks,
      messages: [],
      sources: verifiedLinks.map(l => ({ title: l.title, uri: l.url })),
      stats: {
        totalFound: allLinks.length,
        privateCount: allLinks.filter(l => l.isPrivate).length,
        activeCount: allLinks.length,
        medicalMatches: data?.stats?.medicalMatches || allLinks.length
      }
    };

  } catch (error) {
    console.error("Engine failure:", error);
    throw error;
  }
};
