
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Equipment, EquipmentStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Function declarations for the AI to interact with the app state
export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'checkOutGear',
    parameters: {
      type: Type.OBJECT,
      description: 'Check out a piece of equipment to a specific person and optional project.',
      properties: {
        serialNumber: { type: Type.STRING, description: 'The serial number of the gear.' },
        userName: { type: Type.STRING, description: 'The name of the crew member.' },
        project: { type: Type.STRING, description: 'The name of the production/project.' },
      },
      required: ['serialNumber', 'userName'],
    },
  },
  {
    name: 'checkInGear',
    parameters: {
      type: Type.OBJECT,
      description: 'Check in a piece of equipment back to the inventory.',
      properties: {
        serialNumber: { type: Type.STRING, description: 'The serial number of the gear to return.' },
        notes: { type: Type.STRING, description: 'Optional return notes about condition.' },
      },
      required: ['serialNumber'],
    },
  },
  {
    name: 'reportDamage',
    parameters: {
      type: Type.OBJECT,
      description: 'Flag a piece of gear as damaged and move it to maintenance.',
      properties: {
        serialNumber: { type: Type.STRING, description: 'Serial number of the damaged item.' },
        description: { type: Type.STRING, description: 'Description of the damage.' },
      },
      required: ['serialNumber', 'description'],
    },
  },
  {
    name: 'getInventorySummary',
    parameters: {
      type: Type.OBJECT,
      description: 'Get a summary of inventory based on category or project.',
      properties: {
        category: { type: Type.STRING, description: 'Optional category filter.' },
        project: { type: Type.STRING, description: 'Optional project filter.' },
      },
    },
  }
];

export const getGripAdvice = async (
  prompt: string, 
  inventory: Equipment[],
  history: { role: 'user' | 'assistant'; content: string }[]
) => {
  const model = "gemini-3-flash-preview";
  
  const inventoryContext = inventory.map(item => 
    `- ${item.name} (${item.serialNumber}): ${item.status}${item.currentHolder ? ` held by ${item.currentHolder}` : ''}${item.currentProject ? ` on project ${item.currentProject}` : ''}`
  ).join('\n');

  const systemInstruction = `
    You are "GripBot", the master inventory manager for a major film studio.
    You assist the Grip and Electric departments. You can PERFORM ACTIONS like check-outs, damage reports, and project assignments.
    
    Current Inventory:
    ${inventoryContext}
    
    Guidelines:
    1. Be concise, technical, and high-energy.
    2. When gear is returned damaged, use 'reportDamage'.
    3. You can provide kit lists for specific lighting setups (e.g., 'What do I need for a 3-point interview setup?').
    4. Safety first.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
        { parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: toolDeclarations }],
        temperature: 0.7,
      },
    });

    return response;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const generateEquipmentImage = async (equipmentName: string): Promise<string | null> => {
  try {
    // Enhanced prompt for industrial-grade cinematic equipment
    const prompt = `A professional, hyper-realistic commercial photograph of a ${equipmentName}. 
    This is high-end film studio gear (Grip and Lighting department). 
    Features: Heavy-duty metal textures, industrial finish, Matthews or Avenger equipment aesthetic, matte black or chrome surfaces. 
    Lighting: Clean 3-point studio lighting with high-contrast shadows. 
    Background: Neutral dark grey concrete studio floor, minimal and modern. 
    Technical quality: 8k resolution, razor sharp detail, shallow depth of field.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3"
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
    console.error("Image Generation Error:", error);
    return null;
  }
};

export function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeAudio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
