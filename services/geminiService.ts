
import { GoogleGenAI, Type, Chat } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const IDEAS_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'imagen-4.0-generate-001';
const CHAT_MODEL = 'gemini-2.5-flash';

async function generatePageIdeas(theme: string): Promise<string[]> {
    const prompt = `You are a creative assistant for children's coloring books.
    Generate 5 unique, simple, and fun coloring page subjects based on the theme: "${theme}".
    The subjects should be distinct from each other.
    Respond ONLY with a valid JSON array of 5 strings.
    Example for theme "Magical Forest": ["A friendly gnome fishing in a glowing stream", "A unicorn sleeping under a giant mushroom", "A family of squirrels having a picnic", "A fairy castle built into a large tree", "A clumsy baby dragon trying to fly"]`;

    try {
        const response = await ai.models.generateContent({
            model: IDEAS_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        
        const ideas = JSON.parse(response.text);
        if (Array.isArray(ideas) && ideas.length > 0) {
            return ideas.slice(0, 5);
        }
    } catch (error) {
        console.error("Failed to generate page ideas, using fallback.", error);
    }
    
    // Fallback if API fails or returns unexpected format
    return [
        `a cute ${theme} character`,
        `a funny ${theme} scene`,
        `a big ${theme} castle or vehicle`,
        `a group of ${theme} friends`,
        `a ${theme} animal playing`,
    ];
}

async function generateSingleImage(prompt: string): Promise<string> {
    const response = await ai.models.generateImages({
        model: IMAGE_MODEL,
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '3:4', // Portrait orientation for pages
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
}

export async function generateColoringBook(theme: string, childName: string): Promise<string[]> {
    const coverPrompt = `Children's coloring book cover with the theme of "${theme}". It must feature the name "${childName}" written in big, fun, bubbly letters. Black and white line art, thick outlines, simple style suitable for coloring. Centered composition.`;

    const pageIdeas = await generatePageIdeas(theme);

    const pagePrompts = pageIdeas.map(idea => 
        `Coloring book page for a child. Subject: ${idea}. Simple black and white line art with thick, bold outlines. No shading, no complex backgrounds. Clean vector style.`
    );

    const allPrompts = [coverPrompt, ...pagePrompts];
    const imagePromises = allPrompts.map(prompt => generateSingleImage(prompt));
    
    return Promise.all(imagePromises);
}

export const chat: Chat = ai.chats.create({
  model: CHAT_MODEL,
  config: {
    systemInstruction: 'You are a friendly and helpful chatbot for a children\'s coloring book app. Keep your answers concise, positive, and cheerful.',
  },
});
