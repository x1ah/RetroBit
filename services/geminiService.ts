import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePixelArtCover = async (songTitle: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A retro 8-bit pixel art album cover for a chiptune song titled "${songTitle}". Vibrant neon colors, cyberpunk or fantasy rpg aesthetic, high contrast, pixelated style.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64ImageBytes) {
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating cover:", error);
    return null;
  }
};

export const generateSongDescription = async (songTitle: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `请为歌曲 "${songTitle}" 写一段简短的（2句话以内）游戏背景设定描述。假设这首歌是 80年代 NES 红白机或 Game Boy 像素游戏的背景音乐。请用中文回答，富有想象力和复古感。`,
    });
    return response.text || "数据已损坏...请重新插入卡带。";
  } catch (error) {
    console.error("Error generating description:", error);
    return "读取失败...吹一吹卡带再试一次。";
  }
};