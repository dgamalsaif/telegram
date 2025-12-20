
import { GoogleGenAI } from "@google/genai";
import { SearchResult, IntelLink, SearchParams, PlatformType } from "../types";

// Helper to clean JSON output from AI
const parseSafeJSON = (text: string): any => {
  try {
    let cleanText = text.trim();
    cleanText = cleanText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(cleanText);
  } catch (e) {
    return null;
  }
};

// --- ALGORITHM V9: TURBO STEALTH RECON ---
const buildSearchVector = (params: SearchParams): string => {
  const { query, platforms, identities } = params;
  
  // 1. TURBO PATTERNS (Optimized for speed & precision)
  const turboPatterns: Record<string, string> = {
    'Telegram': '("t.me/+" OR "t.me/joinchat/" OR "t.me/c/")',
    'WhatsApp': '("chat.whatsapp.com/")',
    'Discord': '("discord.gg/" OR "discord.com/invite/")',
  };

  // 2. AGGRESSIVE CONTEXT ANCHORS
  const contextTags = [
    'invite', 'join', 'private', 'hidden', 'leaked', 'رابط', 'قروب', 'سري'
  ];

  const activePlatforms = platforms.length > 0 ? platforms : ['Telegram', 'WhatsApp', 'Discord'];
  const platformQuery = activePlatforms
    .map(p => turboPatterns[p] || `"${p}"`) 
    .join(' OR ');

  // Inject identity context to "pivot" search results towards user-relevant circles
  const identityContext = identities.map(id => `"${id.value}"`).join(' OR ');

  return `
    (${query}) 
    (${platformQuery})
    (${contextTags.join(' OR ')})
    ${identityContext ? `AND (${identityContext})` : ''}
    -inurl:help -inurl:support
  `.replace(/\s+/g, ' ').trim();
};

export interface EnhancedSearchResult extends SearchResult {
  suggestion: string;
}

export const searchGlobalIntel = async (params: SearchParams): Promise<EnhancedSearchResult> => {
  // Initialize AI for every request to ensure latest API key usage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const searchVector = buildSearchVector(params);
  
  const systemInstruction = `
    ROLE: ELITE HUMAN-AGENT OSINT ANALYST (V9 TURBO).
    MISSION: Rapidly extract all links (Telegram Private/Public, Discord, WhatsApp) from digital noise.
    
    PROTOCOLS:
    1. WORD-BY-WORD SCAN: Detect URLs hidden in snippets or chat-like text.
    2. PRIVATE SIGNAL: Identify "joinchat" and "+" links as [PRIVATE].
    3. IDENTITY AWARENESS: Simulate scan using these active sessions: ${params.identities.map(i => i.platform).join(', ')}.
    4. SOURCE DETECTION: Identify where the link was mentioned (e.g. "Pinned in Pedia-Group", "Message from @Admin").
    5. SUGGESTION: Write a 1-sentence strategic suggestion for finding more private intel.
    
    SPEED MODE: BE CONCISE. OUTPUT ONLY JSON.
    
    JSON SCHEMA:
    {
      "analysis": "Executive summary of signals.",
      "suggestion": "Human-like strategic advice.",
      "links": [
        {
          "title": "Group/Channel Name",
          "url": "Direct URL",
          "platform": "Telegram|WhatsApp|Discord|...",
          "type": "Group|Channel|Community",
          "description": "Short context",
          "context": "The specific mention/snippet",
          "sharedBy": "Who shared this link",
          "confidence": 0-100,
          "status": "Active",
          "tags": ["Private", "Direct Link", "Mentioned"]
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `V9 TURBO SCAN: ${searchVector}. Identify all private and public uplinks.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
        // Disable thinking budget for maximum speed as per user request
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const rawData = parseSafeJSON(response.text);
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // 1. EXTRACT FROM GROUNDING (Live Data)
    const groundingLinks: IntelLink[] = grounding
      .filter((c: any) => c.web && c.web.uri)
      .map((c: any, i: number) => {
        const uri = c.web.uri;
        let platform: PlatformType = 'Telegram';
        let isPrivate = false;

        if (uri.includes('t.me/+') || uri.includes('joinchat')) { platform = 'Telegram'; isPrivate = true; }
        else if (uri.includes('chat.whatsapp.com')) { platform = 'WhatsApp'; isPrivate = true; }
        else if (uri.includes('discord.gg') || uri.includes('discord.com/invite')) { platform = 'Discord'; }
        
        return {
          id: `g-${i}`,
          title: c.web.title || `Signal ${i}`,
          url: uri,
          description: "Detected in platform discovery index.",
          platform,
          type: 'Group',
          status: 'Active',
          confidence: isPrivate ? 95 : 75,
          source: "Live Index",
          tags: isPrivate ? ['Private', 'Direct Link'] : ['Discovery'],
          location: params.location?.country || 'Global'
        };
      });

    // 2. MERGE AI DISCOVERY (Simulation of Deep Chat Extraction)
    let finalLinks = [...groundingLinks];
    const seenUrls = new Set(groundingLinks.map(l => l.url.toLowerCase()));

    if (rawData && Array.isArray(rawData.links)) {
      rawData.links.forEach((link: any) => {
        if (link.url && !seenUrls.has(link.url.toLowerCase())) {
          finalLinks.push({
            ...link,
            id: `ai-${Math.random().toString(36).substr(2, 9)}`,
            confidence: link.confidence || 80,
            tags: link.tags || []
          });
        }
      });
    }

    // 3. FINAL AGGREGATION
    const minConf = params.filters?.minConfidence || 5;
    let results = finalLinks.filter(l => l.confidence >= minConf);
    
    if (params.platforms.length > 0) {
      const pSet = new Set(params.platforms);
      results = results.filter(l => pSet.has(l.platform));
    }

    results.sort((a, b) => {
      const aW = (a.tags.includes('Private') ? 1000 : 0) + a.confidence;
      const bW = (b.tags.includes('Private') ? 1000 : 0) + b.confidence;
      return bW - aW;
    });

    return {
      analysis: rawData?.analysis || "V9 Turbo scan complete. Signal landscape identified.",
      suggestion: rawData?.suggestion || "Consider searching for center-specific codes (e.g. 'R1 KFSH' or 'R1 Military Hospital').",
      links: results,
      stats: {
        total: results.length,
        platformDistribution: results.reduce((acc, curr) => {
          acc[curr.platform] = (acc[curr.platform] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        topLocations: Array.from(new Set(results.map(r => r.location).filter(Boolean))) as string[]
      }
    };

  } catch (error) {
    console.error("V9 ENGINE FAILURE:", error);
    throw error;
  }
};
