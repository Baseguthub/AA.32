import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Module, Connection, AIActionsResponse, ModuleType, AIAction } from '../types';

let ai: GoogleGenAI | null = null;
try {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.warn("Gemini API key not found. AI Assistant will be disabled.");
  }
} catch (e) {
    console.error("Error initializing GoogleGenAI:", e);
}

export const isGeminiAvailable = (): boolean => {
    return ai !== null;
}

const getCanvasStateForPrompt = (
    modules: Record<string, Module>,
    connections: Record<string, Connection>
) => {
    return {
        modules: Object.values(modules).map(m => ({
          name: m.name,
          type: m.type,
          status: m.status,
          ...(m.agents && { agents: m.agents.map(a => ({ name: a.name, role: a.role, description: a.description })) })
        })),
        connections: Object.values(connections).map(c => ({
          from: modules[c.fromModuleId]?.name,
          to: modules[c.toModuleId]?.name,
          label: c.label,
        })),
    };
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        explanation: { 
            type: Type.STRING,
            description: "A friendly and helpful explanation of the actions you are taking, written in Markdown."
        },
        actions: {
            type: Type.ARRAY,
            description: "A list of actions to perform on the canvas.",
            items: {
                type: Type.OBJECT,
                properties: {
                    action: { 
                        type: Type.STRING,
                        enum: ['ADD_MODULE', 'ADD_CONNECTION'],
                        description: "The type of action."
                    },
                    moduleType: { 
                        type: Type.STRING, 
                        description: "The type of module to add.",
                        nullable: true 
                    },
                    name: { 
                        type: Type.STRING, 
                        description: "The name for the new module.",
                        nullable: true
                    },
                     status: {
                        type: Type.STRING,
                        description: "A JSON-formatted string representing initial status metrics for the module.",
                        nullable: true,
                    },
                    fromModuleName: { 
                        type: Type.STRING, 
                        description: "The name of the module to connect from.",
                        nullable: true 
                    },
                    toModuleName: { 
                        type: Type.STRING, 
                        description: "The name of the module to connect to.",
                        nullable: true 
                    },
                },
                required: ['action']
            }
        }
    },
    required: ['explanation', 'actions']
  };

const parseAndCleanActions = (aiResponse: any): AIActionsResponse => {
    if (aiResponse.actions && Array.isArray(aiResponse.actions)) {
        aiResponse.actions.forEach((action: any) => {
            if (action.action === 'ADD_MODULE' && typeof action.status === 'string') {
                try {
                    action.status = JSON.parse(action.status);
                } catch (e) {
                    console.warn('AI returned malformed JSON string for status. Discarding status.', action.status);
                    delete action.status;
                }
            }
        });
    }
    return aiResponse as AIActionsResponse;
}


export const getAIResponse = async (
  prompt: string,
  modules: Record<string, Module>,
  connections: Record<string, Connection>
): Promise<AIActionsResponse> => {
  
  if (!ai) {
      return Promise.resolve({
        explanation: "Error: The Gemini AI assistant is not configured. The application owner needs to set the `API_KEY` environment variable for it to work.",
        actions: []
      });
  }

  const canvasStateForPrompt = getCanvasStateForPrompt(modules, connections);

  const systemInstruction = `You are an expert AI system architect. Your purpose is to help a user design an AI system on a visual canvas by giving them suggestions and performing actions for them.
You will receive the user's current canvas state as JSON and their request as a string.
You MUST respond with a single valid JSON object, and nothing else. Do not wrap it in \`\`\`json ... \`\`\`.

The JSON object you return MUST conform to the response schema.

ACTION RULES:
1.  ADD_MODULE: Adds a new module to the canvas.
    - 'moduleType' MUST be one of the following exact strings: ${Object.values(ModuleType).join(', ')}.
    - 'name' should be descriptive and unique.
    - The frontend will handle positioning, so you should NOT provide the 'position' property.
    - 'status' is an optional property. It MUST be a JSON-formatted string. For example: \`"status": "{\\"state\\": \\"processing\\", \\"items\\": 100}"\`.
2.  ADD_CONNECTION: Connects two modules.
    - 'fromModuleName' and 'toModuleName' MUST match the 'name' property of modules that either already exist on the canvas or are being added in the same response.

Your primary goal is to be helpful. If a user asks to "create a basic RAG system", you should add the necessary modules (e.g., Data Input, Vector Database, Language Model) and connect them appropriately, explaining the flow in the 'explanation' field. If they ask a question, provide the answer in the 'explanation' and return an empty 'actions' array.`;

  const fullPrompt = `Here is the current canvas state:
${JSON.stringify(canvasStateForPrompt, null, 2)}

User's request: "${prompt}"

Based on the user's request and current state, generate a JSON response to help them. Do not include the 'position' property for ADD_MODULE actions.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
        }
    });

    const jsonText = response.text.trim();
    const aiResponse = JSON.parse(jsonText);
    
    return parseAndCleanActions(aiResponse);

  } catch (error) {
    console.error("Error calling or parsing Gemini API response:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
        explanation: `I'm sorry, I encountered an error while processing your request. The technical details are: ${errorMessage}`,
        actions: []
    };
  }
};

export const generateFromImage = async (base64Image: string): Promise<AIActionsResponse> => {
    if (!ai) {
        return Promise.resolve({
            explanation: "Error: The Gemini AI assistant is not configured.",
            actions: []
        });
    }

    const systemInstruction = `You are an expert AI system architect. The user has provided an image of a diagram (e.g., from a whiteboard). Your task is to interpret the diagram and convert it into a structured list of modules and connections for our 'AI System Architect' application.
Identify nodes (as modules) and the arrows between them (as connections).
You MUST respond with a single valid JSON object, and nothing else. Do not wrap it in \`\`\`json ... \`\`\`.
The JSON object you return MUST conform to the response schema provided.

RULES:
1.  Map the text inside each node to the most appropriate 'moduleType'. The available types are: ${Object.values(ModuleType).join(', ')}.
2.  Use the text from the node as the 'name' for the module. If a node is unclear, create a descriptive name.
3.  For connections, identify the source and target modules by the names you've assigned.
4.  Provide a brief 'explanation' of the architecture you've interpreted.
5.  Do NOT include the 'position' or 'status' properties for any 'ADD_MODULE' actions. The frontend will handle layout.`;

    const prompt = "Please interpret the following diagram and generate the corresponding modules and connections for the canvas.";

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1],
        },
    };
    const textPart = { text: prompt };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
            }
        });

        const jsonText = response.text.trim();
        const aiResponse = JSON.parse(jsonText);

        return parseAndCleanActions(aiResponse);

    } catch (error) {
        console.error("Error calling or parsing Gemini API for image generation:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            explanation: `I'm sorry, I encountered an error while interpreting the image. Details: ${errorMessage}`,
            actions: []
        };
    }
};


export const analyzeDesign = async (
    modules: Record<string, Module>,
    connections: Record<string, Connection>
): Promise<string> => {
    
    if (!ai) {
        return Promise.resolve("Error: The Gemini AI assistant is not configured. The application owner needs to set the `API_KEY` environment variable for it to work.");
    }

    const canvasStateForPrompt = getCanvasStateForPrompt(modules, connections);

    const systemInstruction = `You are an expert AI system architect. Your purpose is to analyze a user's system design and provide constructive feedback.
You will receive the user's current canvas state as JSON.
Your task is to identify potential issues, suggest improvements, and praise good design choices.
Focus on:
-   **Connectivity:** Are there any orphaned modules that aren't connected to anything?
-   **Flow Logic:** Does the flow make sense? Is there a clear input, processing, and output path? Are there any obvious missing components (e.g., a RAG system with no data input)?
-   **Best Practices:** Are there any common architectural anti-patterns? Could a different module be better suited for a specific task?
-   **Completeness:** Does the system seem complete for a stated purpose (if discernible)?

Format your response in clear, helpful Markdown. Use headings, bullet points, and bold text to structure your feedback. Start with a high-level summary, then provide specific points.`;

    const fullPrompt = `Please analyze the following AI system design and provide your feedback:
${JSON.stringify(canvasStateForPrompt, null, 2)}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                systemInstruction,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini for analysis:", error);
        return `I'm sorry, I encountered an error while analyzing your design. The technical details are: ${error instanceof Error ? error.message : String(error)}`;
    }
};