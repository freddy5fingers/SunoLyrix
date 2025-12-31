
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GenerationParams } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const getRandomArtistSuggestion = async (genre: string): Promise<string> => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest one famous music artist or band from the United States or Canada that is either a legendary icon, a rising star, or an experimental pioneer in the ${genre} genre. 
      Be specific and choose someone with a distinct lyrical or musical style known in North America. 
      Return ONLY the name of the artist, nothing else. No punctuation, no quotes.`,
    });
    return response.text?.trim() || "The Weeknd";
  } catch (error) {
    console.error("Failed to get artist suggestion:", error);
    return "Various Artists";
  }
};

export const regenerateSection = async (sectionLabel: string, fullLyrics: string, params: GenerationParams): Promise<string> => {
  const ai = getAIClient();
  const artistContext = params.artist ? `Keep the style of ${params.artist}.` : "";
  
  const prompt = `You are a professional songwriter. I have a song in progress, and I need you to rewrite ONLY the [${sectionLabel}] section.
  
  CURRENT SONG CONTEXT:
  ${fullLyrics}
  
  GENRE: ${params.genre}
  MOOD: ${params.mood}
  VOCAL STYLE: ${params.vocalStyle === 'Auto (Best Suited)' ? 'Determine the best texture for this song' : params.vocalStyle}
  INSTRUMENTAL DNA: ${params.instrumentalProfile === 'Auto (Best Suited)' ? 'Determine the best profile for this song' : params.instrumentalProfile}
  ${artistContext}
  
  INSTRUCTIONS:
  1. Rewrite only the [${sectionLabel}] section.
  2. Maintain the theme and narrative flow of the rest of the song.
  3. Keep the rhythmic structure similar so it fits the music.
  4. Return ONLY the new section starting with [${sectionLabel}] and ending with the lyrics. Do not include other sections.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Section regeneration failed:", error);
    throw error;
  }
};

export const generateLyricsStream = async function* (params: GenerationParams) {
  const ai = getAIClient();
  
  const contentLevel = params.isExplicit 
    ? "EXPLICIT (18+). You are allowed to use strong language, adult themes, and raw, uncensored emotions."
    : "CLEAN/RADIO-FRIENDLY. Avoid profanity and overly graphic adult themes.";

  const artistContext = params.artist 
    ? `EMULATE ARTIST STYLE: Write in the distinct lyrical style, vocabulary, and structural approach of ${params.artist}. Use their typical metaphors, rhythmic patterns, and vocabulary common to their North American discography.`
    : "STYLE: Generic high-quality songwriting.";

  const vocalProfile = params.vocalStyle === 'Auto (Best Suited)' 
    ? "Determine the most effective vocal texture based on genre and mood." 
    : params.vocalStyle;
    
  const instrumentalProfile = params.instrumentalProfile === 'Auto (Best Suited)' 
    ? "Determine the most effective instrumental profile based on genre and mood." 
    : params.instrumentalProfile;

  const sonicProfile = `VOCAL DNA: ${vocalProfile}. INSTRUMENTAL DNA: ${instrumentalProfile}.`;

  const prompt = `Write a song optimized for Suno AI. 
  Topic: ${params.topic}
  Genre: ${params.genre}
  Mood: ${params.mood}
  ${artistContext}
  ${sonicProfile}
  Include Bridge: ${params.includeBridge}
  Language: ${params.language}
  Content Policy: ${contentLevel}

  CRITICAL FORMATTING INSTRUCTIONS (Do not deviate):
  1. Start with "TITLE: [The Song Title]"
  2. Follow with "STYLE: [A Suno-compatible style prompt, max 100 chars, blending genre, mood, vocal profile, instrumental profile, and artist vibe]"
  3. Then write the lyrics using clear bracketed meta-tags: [Intro], [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro]. 
     - Adjust syllable density and rhythm based on the chosen Sonic DNA.
  4. Finally, end with "EXPLANATION: [A brief 2-sentence breakdown of the song structure and how the Sonic DNA (even if auto-determined) was applied]".

  Write the song now, streaming it line by line.`;

  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3-pro-preview",
    contents: prompt,
  });

  for await (const chunk of responseStream) {
    yield (chunk as GenerateContentResponse).text;
  }
};

export const generateCoverArt = async (title: string, genre: string, mood: string): Promise<string | null> => {
  const ai = getAIClient();
  const prompt = `Professional album cover art for a song titled "${title}". 
  Musical Genre: ${genre}. 
  Mood: ${mood}. 
  Art style: Modern, cinematic, abstract representation, high resolution, 4k. 
  NO TEXT on the image. Vivid colors reflecting the mood.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
};
