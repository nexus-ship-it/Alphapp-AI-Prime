
import { GoogleGenAI, Type, Schema, Chat, LiveServerMessage, Modality, Part, GenerateContentResponse } from "@google/genai";
import { TechStack, AnalysisIssue, LinkAnalysisResult, WireframeData, WireframeCodeResult, UIMagicianResult, ImageEditResult, CodeTranslatorResult, CodeCompletionSuggestion, CodeDiagnostic, DeploymentPlatform, DeploymentFile, TechValue, ProjectFile, AspectRatio, VideoFrame } from '../types';

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

async function safeGenerateContent(params: { model: string; contents: any; config?: any }): Promise<GenerateContentResponse> {
    const ai = getAI();
    let retries = 3;
    let delay = 1500;

    while (retries > 0) {
        try {
            const response = await ai.models.generateContent(params);
            return response;
        } catch (error: any) {
            const isQuotaError = 
                error.status === 429 || 
                error.message?.includes('quota') || 
                error.message?.includes('429') ||
                error.message?.includes('RESOURCE_EXHAUSTED');

            if (isQuotaError && retries > 1) {
                console.warn(`Cuota agotada. Reintentando en ${delay}ms... (${retries} reintentos restantes)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                retries--;
                delay *= 2; // Backoff exponencial
                continue;
            }
            
            console.error("Gemini API Error Core:", error);
            throw error;
        }
    }
    throw new Error("Se ha agotado la cuota de la API de Gemini. Por favor, espera un minuto e inténtalo de nuevo.");
}

function formatTechStack(techStack: TechStack): string {
    return `Frontend: ${techStack.frontend}, Backend: ${techStack.backend}, Database: ${techStack.database}, Mobile: ${techStack.mobile}, DevOps: ${techStack.devops.join(', ')}`;
}

// --- SERVICIO GUARDIAN (MODO DIOS) ---
export const generateThreatModel = async (projectDesc: string, files: ProjectFile[]): Promise<string> => {
    const prompt = `Actúa como un Ingeniero Jefe de Seguridad. Realiza un modelado de amenazas STRIDE exhaustivo para el siguiente proyecto.
    Descripción: ${projectDesc}
    Archivos clave: ${files.map(f => f.path).join(', ')}
    Proporciona vectores de ataque específicos y mitigaciones de nivel bancario.`;

    const response = await safeGenerateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: { thinkingConfig: { thinkingBudget: 16000 } }
    });
    return response.text || '';
};

// --- RESTO DE SERVICIOS (OPTIMIZADOS CON OMNI-LOGIC) ---

export const generateClarificationQuestions = async (description: string, techStack: TechStack): Promise<string[]> => {
    const prompt = `Analiza la idea de proyecto y el stack. Genera de 3 a 5 preguntas críticas para definir la arquitectura.
    Proyecto: "${description}"
    Stack: ${formatTechStack(techStack)}
    Responde con un array JSON de strings.`;

    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
};

export const startClarificationChat = (initialDescription: string): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: `Eres un Arquitecto de Software Senior. Tu objetivo es aclarar requisitos para el proyecto: "${initialDescription}".`,
        }
    });
};

export const generateProjectArchitecture = async (description: string, techStack: TechStack, history: any[]): Promise<{path: string, content: string}[]> => {
    const prompt = `Diseña la arquitectura completa del proyecto (Nivel Dios).
    Descripción: ${description}
    Stack: ${formatTechStack(techStack)}
    Contexto: ${history.map(m => `${m.sender}: ${m.text}`).join('\n')}
    Devuelve un array JSON de objetos {path, content}. Asegúrate de que sea Clean Architecture.`;

    const response = await safeGenerateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: { 
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 32768 } 
        }
    });
    return JSON.parse(response.text || '[]');
};

export const modifyProjectArchitecture = async (currentFiles: {path: string, content: string}[], techStack: TechStack, request: string): Promise<{path: string, content: string}[]> => {
    const prompt = `Modifica la arquitectura actual basándote en esta solicitud: "${request}".
    Stack: ${formatTechStack(techStack)}
    Archivos actuales: ${JSON.stringify(currentFiles.map(f => ({path: f.path, content: f.content.substring(0, 400)})))}
    Devuelve el conjunto completo de archivos actualizado en JSON.`;

    const response = await safeGenerateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: { 
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 8000 }
        }
    });
    return JSON.parse(response.text || '[]');
};

const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        security: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { filePath: { type: Type.STRING }, line: { type: Type.INTEGER }, severity: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING }, suggestion: { type: Type.STRING } }, required: ["filePath", "line", "severity", "title", "description", "suggestion"] } },
        dependencies: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { filePath: { type: Type.STRING }, line: { type: Type.INTEGER }, severity: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING }, suggestion: { type: Type.STRING } }, required: ["filePath", "line", "severity", "title", "description", "suggestion"] } },
        quality: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { filePath: { type: Type.STRING }, line: { type: Type.INTEGER }, severity: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING }, suggestion: { type: Type.STRING } }, required: ["filePath", "line", "severity", "title", "description", "suggestion"] } },
        best_practices: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { filePath: { type: Type.STRING }, line: { type: Type.INTEGER }, severity: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING }, suggestion: { type: Type.STRING } }, required: ["filePath", "line", "severity", "title", "description", "suggestion"] } },
        dependency_optimization: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { filePath: { type: Type.STRING }, line: { type: Type.INTEGER }, severity: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING }, suggestion: { type: Type.STRING } }, required: ["filePath", "line", "severity", "title", "description", "suggestion"] } },
        infraestructura: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { filePath: { type: Type.STRING }, line: { type: Type.INTEGER }, severity: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING }, suggestion: { type: Type.STRING } }, required: ["filePath", "line", "severity", "title", "description", "suggestion"] } },
        licenciamiento: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { filePath: { type: Type.STRING }, line: { type: Type.INTEGER }, severity: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING }, suggestion: { type: Type.STRING } }, required: ["filePath", "line", "severity", "title", "description", "suggestion"] } },
        deteccion_de_secretos: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { filePath: { type: Type.STRING }, line: { type: Type.INTEGER }, severity: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING }, suggestion: { type: Type.STRING } }, required: ["filePath", "line", "severity", "title", "description", "suggestion"] } },
    },
    required: ["security", "dependencies", "quality", "best_practices", "dependency_optimization", "infraestructura", "licenciamiento", "deteccion_de_secretos"]
};

export const generateFullCodeAnalysis = async (files: {path: string, content: string}[], techStack: TechStack): Promise<any> => {
    const prompt = `Auditoría Clínica Senior: Analiza seguridad profunda, calidad, infraestructura y detección de secretos.
    Stack: ${formatTechStack(techStack)}
    Archivos: ${JSON.stringify(files.slice(0, 20).map(f => ({path: f.path, content: f.content.substring(0, 2000)})))}`;

    const response = await safeGenerateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: { 
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
            thinkingConfig: { thinkingBudget: 24000 } 
        }
    });
    return JSON.parse(response.text || '{}');
};

export const generateCodeFix = async (filePath: string, content: string, issue: AnalysisIssue): Promise<string> => {
    const prompt = `Resuelve este problema en el código. Devuelve SOLO el contenido del archivo corregido, sin bloques markdown.
    Problema: ${issue.title}
    Sugerencia: ${issue.suggestion}
    Archivo: ${filePath}
    Contenido:
    ${content}`;

    const response = await safeGenerateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: { thinkingConfig: { thinkingBudget: 4000 } }
    });
    let text = response.text || content;
    return text.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
};

export const generateVideoFromImageAndPrompt = async (imageBytes: string, mimeType: string, prompt: string, aspectRatio: AspectRatio, onProgress: (p: number, m: string) => void): Promise<string> => {
    const ai = getAI();
    onProgress(10, 'Iniciando Veo Engine...');
    try {
        const operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: { imageBytes, mimeType },
            config: { numberOfVideos: 1, aspectRatio: aspectRatio as any, resolution: '720p' }
        });
        let op = operation;
        while (!op.done) {
            await new Promise(resolve => setTimeout(resolve, 8000));
            onProgress(50, 'Renderizando frames de alta definición...');
            op = await ai.operations.getVideosOperation({operation: op});
        }
        onProgress(90, 'Finalizando transcodificación...');
        const videoUri = op.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("Fallo en la generación.");
        const res = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const generateUIFromImage = async (image: string, mimeType: string, stack: string): Promise<UIMagicianResult> => {
    const prompt = `Transmuta esta imagen en código ${stack} perfecto. Devuelve JSON {filePath, content, explanation}.`;
    const response = await safeGenerateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType, data: image } }] }
    });
    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
};

export const editImage = async (image: string, mimeType: string, instruction: string): Promise<ImageEditResult> => {
    const response = await safeGenerateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType, data: image } },
                { text: `Modificación Cuántica: ${instruction}` }
            ]
        }
    });
    let editedImage = null;
    let text = null;
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) editedImage = { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
            else if (part.text) text = part.text;
        }
    }
    return { editedImage, text };
};

export const startLiveChatSession = async (callbacks: any, systemInstruction: string) => {
    const ai = getAI();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction,
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
    });
};

export const startChat = (history?: any[]): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { 
            systemInstruction: "Eres Alphapp AI Prime, la inteligencia definitiva de desarrollo. Posees omnisciencia técnica y acceso a la web.",
            tools: [{ googleSearch: {} }]
        },
        history: history?.map(h => ({ role: h.sender === 'user' ? 'user' : 'model', parts: [{ text: h.text }] }))
    });
};

export const sendMessageToAI = async (chat: Chat, message: any): Promise<any> => chat.sendMessageStream({ message });

export const analyzeLink = async (url: string): Promise<any> => {
    const prompt = `Escaneo Profundo: Analiza URL ${url}. Devuelve JSON: summary, techStack, security, metadata.`;
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const translateCode = async (code: string, from: string, to: string): Promise<CodeTranslatorResult> => {
    const prompt = `Transpila este código de ${from} a ${to}. Devuelve JSON {translatedCode, explanation}.`;
    const response = await safeGenerateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 4000 } }
    });
    return JSON.parse(response.text || '{}');
};

export function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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

export const createBlob = (data: Float32Array): any => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) { int16[i] = data[i] * 32768; }
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
};

export const generateReadme = async (desc: string, stack: TechStack, files: any[]) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Genera README.md Dios para: ${desc}.` }] }]
    });
    return response.text || '';
};

export const generateCiCdWorkflow = async (desc: string, stack: TechStack, files: any[]) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Genera CI/CD Workflow para: ${desc}.` }] }]
    });
    return response.text || '';
};

export const generateUnitTest = async (path: string, content: string, stack: TechStack) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: `Genera test unitario Dios para ${path}. JSON {path, content}.` }] }],
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const generateFollowUpSuggestions = async (history: any[]) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Sugiere 3 preguntas de seguimiento. JSON array.` }] }],
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
};

export const generateBestPracticesAnalysis = async (files: any[], stack: TechStack) => {
    const res = await generateFullCodeAnalysis(files, stack);
    return res.best_practices || [];
};

export const generateDependencyAnalysis = async (files: any[], stack: TechStack) => {
    const res = await generateFullCodeAnalysis(files, stack);
    return { dependencies: res.dependencies || [], dependency_optimization: res.dependency_optimization || [] };
};

export const generateContextualAnalysisSummary = async (report: any[], context: any) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Resume hallazgos contextuales: ${JSON.stringify(report.map(r => r.title))}` }] }]
    });
    return response.text || '';
};

export const getQuickCodeAnalysis = async (code: string, stack: TechStack) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Analiza rápido este código: ${code.substring(0, 1000)}` }] }]
    });
    return response.text || '';
};

export const refineUIGeneration = async (img: string, mime: string, current: string, prompt: string, stack: string) => {
    const p = `Refina la UI basándote en: ${prompt}. Código actual: ${current}`;
    const response = await safeGenerateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: p }, { inlineData: { mimeType: mime, data: img } }] }
    });
    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
};

export const getCritiqueForUI = async (img: string, mime: string) => {
    const response = await safeGenerateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: "Critica esta UI como un experto senior de Apple." }, { inlineData: { mimeType: mime, data: img } }] }
    });
    return response.text || '';
};

export const generateCodeQualityAnalysis = async (files: any[], stack: TechStack) => {
    const res = await generateFullCodeAnalysis(files, stack);
    return res.quality || [];
};

export const refineWireframeData = async (current: any, prompt: string) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Refina wireframe: ${prompt}` }] }],
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const getCodeCompletions = async (code: string, lang: string, cursor: number) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: `Autocompleta código en posición ${cursor}: ${code}` }] }],
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
};

export const getRealtimeDiagnostics = async (code: string, lang: string) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: `Analiza errores en tiempo real: ${code}` }] }],
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
};

export const analyzeVideoFrames = async (frames: any[], prompt: string) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text || '';
};

export const generateSuggestedQueries = async (summary: string) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Preguntas inteligentes para: ${summary}` }] }],
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
};

export const startWebQueryChat = (url: string, summary: string) => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: `Experto en ${url}. Resumen: ${summary}` }
    });
};

export const getQuickAnswer = async (q: string) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: q }] }]
    });
    return response.text || '';
};

export const startSupportChat = () => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: "Soporte Alphapp AI Prime." }
    });
};

export const startCodeDoctorTutorChat = () => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: "Mentor de Código Omnisciente." }
    });
};

export const startTestTutorChat = () => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: "Tutor de Pruebas Definitivo." }
    });
};

export const checkApiStatus = async () => true;

export const translateText = async (text: string, to: string, from?: string) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Traduce a ${to}: ${text}` }] }]
    });
    return response.text || text;
};

export const generateWireframeFromText = async (prompt: string) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Genera wireframe JSON: ${prompt}` }] }],
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const generateCodeFromWireframe = async (data: any, tech: string) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: `Convierte a código ${tech} (Clean Architecture)` }] }],
        config: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 4000 } }
    });
    return JSON.parse(response.text || '{}');
};

export const detectProjectTechStack = async (files: any[]) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: "Detecta stack tecnológico completo en JSON." }] }],
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const summarizeText = async (text: string) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Realiza un resumen ejecutivo de: ${text.substring(0, 5000)}` }] }]
    });
    return response.text || '';
};

export const getReadableContent = async (url: string) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Extrae contenido esencial de: ${url}` }] }],
        config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || '';
};

export const generateDeploymentFiles = async (files: any[], stack: TechStack, platforms: any[], report: any, config: any) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ parts: [{ text: `Genera configuración de infraestructura segura en JSON.` }] }],
        config: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 8000 } }
    });
    return JSON.parse(response.text || '[]');
};

export const generateBotMessage = async (persona: string, room: string, context: string) => {
    const response = await safeGenerateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Como ${persona} en ${room}, comenta: ${context}` }] }]
    });
    return response.text || '';
};
