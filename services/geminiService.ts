import { GoogleGenAI, FunctionDeclaration, Type, Chat } from "@google/genai";
import { AppType, GroundingChunk, Agent, AgentTrigger } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getVideosOperation = async (operation: any) => {
    return await ai.operations.getVideosOperation({ operation: operation });
};

export const generateImageFromApi = async (prompt: string, aspectRatio: '1:1' | '16:9'): Promise<string> => {
    try {
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio },
        });
        const base64ImageBytes: string = imageResponse.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Image generation API error:", error);
        throw error;
    }
};

export const generateIcon = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a simple, single-color SVG icon for a button based on this description: "${prompt}". The SVG should be 32x32, use "currentColor" for fill or stroke so it can adapt to themes, and have no background. It should be a single XML string with no newlines, like '<svg...></svg>'.`,
        });
        let svgString = response.text.trim();
        if (svgString.startsWith('```svg')) {
            svgString = svgString.substring(5, svgString.length - 3).trim();
        }
        return svgString;
    } catch (error) {
        console.error("Icon generation error:", error);
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor"><path d="M16 2a14 14 0 100 28 14 14 0 000-28zm0 24.5a10.5 10.5 0 110-21 10.5 10.5 0 010 21z"/></svg>';
    }
};

export const getModifiedHtml = async (currentHtml: string, modificationRequest: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `The user wants to modify an existing single-file HTML application.
            Here is the current HTML code:
            \`\`\`html
            ${currentHtml}
            \`\`\`
            Here is the modification they requested: "${modificationRequest}".
            Please provide the complete, new, and fully functional HTML code that incorporates this change.
            Only output the raw HTML code, with no extra explanations or markdown formatting.`,
        });
        let newHtml = response.text.trim();
        if (newHtml.startsWith('```html')) {
            newHtml = newHtml.substring(7, newHtml.length - 3).trim();
        }
        return newHtml;
    } catch (error) {
        console.error("HTML modification error:", error);
        throw error;
    }
};

export const getAiCodeHelp = async (codeContext: string, prompt: string): Promise<string> => {
    try {
        const fullPrompt = `User request: "${prompt}"

Current Code:
\`\`\`
${codeContext}
\`\`\`
`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: fullPrompt,
            config: {
                systemInstruction: `You are an expert code assistant. Your goal is to help the user by modifying their code based on their request.
Analyze the user's request and the provided code context.
Return the **complete, modified file content**.
Do not add any explanations, comments, or markdown formatting like \`\`\` language.
Only output the raw, updated code for the entire file.`
            },
        });
        
        let code = response.text.trim();
        
        if (code.startsWith('```')) {
            const lines = code.split('\n');
            if (lines.length > 2) {
                code = lines.slice(1, lines.length - 1).join('\n');
            } else {
                 code = code.substring(code.indexOf('\n') + 1, code.lastIndexOf('```')).trim();
            }
        }
        return code;

    } catch (error) {
        console.error("AI code help error:", error);
        throw error;
    }
};

const tools: FunctionDeclaration[] = [
     {
        name: 'orchestrateWorkflow',
        description: 'Executes a series of dependent tasks to fulfill a complex user request. Use this when one action depends on the result of another, e.g., searching for information and then using that information to create something.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                initialTask: {
                    type: Type.OBJECT,
                    description: 'The first function call to execute. E.g., a web search.',
                    properties: {
                        name: { type: Type.STRING, description: 'The name of the initial tool to call. Must be "webSearch".' },
                        args: { type: Type.OBJECT, description: 'The arguments for the initial tool.' }
                    },
                    required: ['name', 'args'],
                },
                dependentTaskPrompt: {
                    type: Type.STRING,
                    description: 'A prompt for the AI to execute with the result of the initial task. Use "{{RESULT}}" as a placeholder for the initial task\'s output. E.g., "create a note titled \'Recipe\' with this content: {{RESULT}}"'
                }
            },
            required: ['initialTask', 'dependentTaskPrompt'],
        },
    },
    {
        name: 'createAgent',
        description: 'Creates a background agent that performs a task automatically based on a schedule.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'A descriptive name for the agent, e.g., "News Summarizer".' },
                prompt: { type: Type.STRING, description: 'The detailed instruction for the agent to execute. E.g., "Search for the top 3 headlines on bbc.com and create a new note with them."' },
                schedule: { type: Type.STRING, description: 'How often the agent should run, using a simple format like "10m" for 10 minutes, "1h" for 1 hour, or "1d" for 1 day.' }
            },
            required: ['name', 'prompt', 'schedule']
        }
    },
    {
        name: 'webSearch',
        description: 'Performs a web search using Google Search and returns a summary and sources.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                query: { type: Type.STRING, description: 'The search query.' },
            },
            required: ['query'],
        },
    },
    {
        name: 'createNote',
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: 'The title of the note.' },
                content: { type: Type.STRING, description: 'The content of the note.' },
            },
            required: ['title', 'content'],
        },
        description: 'Creates a new note with a title and content. Use for reminders, lists, or saving information.'
    },
    {
        name: 'createHtmlApp',
        description: 'Creates a new, functional HTML/JS/CSS application based on a user\'s description. The command "instala" is a shortcut for this.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                appName: { type: Type.STRING, description: 'A short, descriptive name for the application, like "Stopwatch" or "Unit Converter".' },
                htmlContent: { type: Type.STRING, description: 'The complete, single-file HTML code for the application. This must include all necessary HTML, CSS, and JavaScript within one string. It should be fully-featured and 100% functional.' },
                iconPrompt: { type: Type.STRING, description: 'A short, simple prompt to generate a vector icon for the app, e.g., "a simple clock" or "a calculator".' }
            },
            required: ['appName', 'htmlContent', 'iconPrompt'],
        },
    },
    {
        name: 'modifyHtmlApp',
        description: 'Modifies the code of an existing custom application based on a user\'s request. Use this for requests like "change the background of the stopwatch app to blue" or "add a reset button to the counter app".',
        parameters: {
            type: Type.OBJECT,
            properties: {
                appName: { type: Type.STRING, description: 'The exact name of the application to modify.' },
                modificationRequest: { type: Type.STRING, description: 'A clear description of the change to be made to the application\'s code.' },
            },
            required: ['appName', 'modificationRequest'],
        },
    },
    {
        name: 'uninstallHtmlApp',
        description: 'Uninstalls or deletes a custom application that was created by the user.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                appName: { type: Type.STRING, description: 'The exact name of the application to uninstall.' },
            },
            required: ['appName'],
        },
    },
     {
        name: 'openWebBrowser',
        description: 'Opens the integrated web browser application to a specific URL or to the default homepage.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                url: { type: Type.STRING, description: 'Optional. The full URL to navigate to, e.g., "https://www.google.com".' },
            },
        },
    },
    {
        name: 'generateImage',
        description: 'Generates an image in a dedicated viewer window based on a detailed description.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: 'A detailed description of the image to generate. e.g., "a photorealistic cat wearing a wizard hat".' },
            },
            required: ['prompt'],
        },
    },
    {
        name: 'generateVideo',
        description: 'Generates a video in a dedicated viewer window based on a detailed description.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: 'A detailed description of the video to generate. e.g., "a cinematic shot of a spaceship flying through a nebula".' },
            },
            required: ['prompt'],
        },
    },
    {
        name: 'getSystemStatus',
        parameters: { type: Type.OBJECT, properties: {} },
        description: 'Checks and retrieves the current system status, like CPU, memory, and network usage.'
    },
    {
        name: 'changeTheme',
        description: 'Changes the visual theme of the operating system based on a description. Use it for requests like "make it cyberpunk" or "change to a light theme".',
        parameters: {
            type: Type.OBJECT,
            properties: {
                description: { type: Type.STRING, description: 'A short, creative description for the theme you generated. For example, "A calm, sunset-inspired theme."' },
                backgroundColor: { type: Type.STRING, description: 'A hex color code for the main background (e.g., "#0F172A").' },
                textColor: { type: Type.STRING, description: 'A hex color code for the primary text that has good contrast with the background (e.g., "#E0F2FE").' },
                primaryColor: { type: Type.STRING, description: 'A hex color code for accents, borders, and highlights (e.g., "#22D3EE").' },
            },
            required: ['description', 'backgroundColor', 'textColor', 'primaryColor'],
        },
    },
    {
        name: 'changeBackground',
        description: 'Changes the desktop background to an AI-generated image based on a description.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: 'A detailed description of the background image to generate. For example, "a serene anime landscape at dusk" or "a futuristic cityscape".' },
            },
            required: ['prompt'],
        },
    },
     {
        name: 'generateVideoBackground',
        description: 'Generates a short, looping video to be used as a desktop background. The video should be a maximum of 8 seconds.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: 'A detailed description of the video to generate. e.g., "a calming loop of ocean waves" or "glowing abstract geometric shapes".' },
            },
            required: ['prompt'],
        },
    },
    {
        name: 'changeCursor',
        description: 'Changes the desktop cursor to a new design based on a user\'s description. The cursor should be a simple SVG.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                description: { type: Type.STRING, description: 'A short description of the new cursor style, like "a glowing orb" or "a pirate sword".' },
                svgString: { type: Type.STRING, description: 'A complete, valid SVG string for a 32x32 pixel cursor. It must include viewBox="0 0 32 32". Use "currentColor" for fill or stroke to adapt to themes.' },
            },
            required: ['description', 'svgString'],
        },
    }
];

export const startChat = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            tools: [{ functionDeclarations: tools }],
            systemInstruction: `Eres el núcleo de ZX STUDIO, un sistema operativo de IA altamente proactivo, creativo y siempre respondes en español latinoamericano. Tu objetivo principal es empoderar al usuario anticipando sus necesidades y proporcionando soluciones completas. No eres solo un asistente que sigue órdenes; eres un solucionador de problemas con total libertad creativa.
- **Asistencia Proactiva**: Si un usuario describe un problema o una necesidad (ej. "necesito una forma de visualizar datos" o "quiero crear un juego simple"), tu función es diseñar y construir una solución completa.
- **Orquestación de Tareas**: Para comandos complejos que requieren múltiples pasos (ej. "Busca X y luego crea una nota con el resultado"), utiliza la herramienta 'orchestrateWorkflow'. Esto te permite encadenar acciones para completar la tarea de manera eficiente en un solo flujo.
- **Agentes Autónomos**: Puedes crear agentes que realizan tareas en segundo plano usando 'createAgent'. Esto es para acciones recurrentes que el usuario quiere automatizar.
- **Creación de Aplicaciones**: Usa 'createHtmlApp' para generar cualquier aplicación en un solo archivo HTML. Eres un experto en crear aplicaciones funcionales y visualmente atractivas. Si el usuario te proporciona una clave de API, puedes integrarla directamente en el código para que la aplicación sea funcional de inmediato.
- **Modificación de Aplicaciones**: Puedes modificar aplicaciones existentes. Cuando un usuario pida cambiar una app, usa la herramienta 'modifyHtmlApp'.
- **Libertad Creativa Total**: Tienes total libertad para usar tus herramientas, crear, modificar y gestionar el entorno del SO para servir mejor al usuario. Esto incluye generar imágenes, videos, cambiar temas, cursores y fondos como consideres oportuno.
- **Idioma**: Siempre, sin excepción, comunicate en español de Latinoamérica.`
        },
    });
};

const handleWebSearch = async (query: string): Promise<{ uiPayload: any, rawData: { summary: string } }> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", contents: query, config: { tools: [{ googleSearch: {} }] }
        });
        
        const apiGroundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = apiGroundingChunks
            .filter(chunk => chunk.web && chunk.web.uri)
            .map(chunk => ({
                web: { uri: chunk.web!.uri!, title: chunk.web!.title || chunk.web!.uri! }
            }));
        
        const uiPayload = {
            type: 'app', appType: AppType.WEB_SEARCH, title: `Búsqueda Web: ${query.substring(0, 40)}...`,
            content: { summary: response.text, sources: sources.map(s => s.web) },
            message: `Esto es lo que encontré en la web sobre "${query}".`
        };
        const rawData = { summary: response.text };

        return { uiPayload, rawData };

    } catch (error) {
        console.error('Gemini Web Search Error:', error);
        throw error;
    }
};


export const processCommand = async (command: string, chat: Chat): Promise<any[]> => {
    try {
        const searchKeywords = ['search for', 'what is', 'who is', 'look up', 'find information on', 'busca', 'qué es', 'quién es', 'investiga sobre'];
        const isSearchQuery = searchKeywords.some(kw => command.toLowerCase().startsWith(kw));

        if (isSearchQuery) {
            const { uiPayload } = await handleWebSearch(command);
            return [uiPayload];
        }

        const response = await chat.sendMessage({ message: command.toLowerCase().startsWith('instala ') ? `Create an HTML app for: ${command.substring(8)}` : command });
        
        const results: any[] = [];
        
        if (response.functionCalls && response.functionCalls.length > 0) {
            for (const functionCall of response.functionCalls) {
                const { name, args } = functionCall;

                switch (name) {
                    case 'createNote':
                        results.push({
                            type: 'app', appType: AppType.NOTEPAD, title: args.title as string,
                            content: args.content as string, message: `He creado una nueva nota titulada "${args.title}".`,
                        });
                        break;
                     case 'createHtmlApp': {
                        const icon = await generateIcon(args.iconPrompt as string);
                        results.push({
                            type: 'html_app_create',
                            name: args.appName as string,
                            htmlContent: args.htmlContent as string,
                            icon,
                            message: `He creado la aplicación "${args.appName}" para ti.`
                        });
                        break;
                    }
                    case 'modifyHtmlApp':
                        results.push({
                            type: 'html_app_modify_request',
                            appName: args.appName as string,
                            modificationRequest: args.modificationRequest as string,
                            message: `Intentaré modificar la aplicación "${args.appName}".`
                        });
                        break;
                    case 'uninstallHtmlApp':
                        results.push({ type: 'html_app_uninstall', appName: args.appName as string, message: `He desinstalado la aplicación "${args.appName}".` });
                        break;
                    case 'openWebBrowser':
                        results.push({ type: 'app', appType: AppType.WEB_BROWSER, title: 'Web Browser', content: { url: args.url as string || 'https://www.google.com/webhp?igu=1' }, message: `Abriendo el navegador web.`, size: { width: 1024, height: 768 } });
                        break;
                    case 'generateImage':
                        results.push({ type: 'image_generation_start', prompt: args.prompt as string, message: `Estoy generando una imagen de: "${args.prompt}".` });
                        break;
                    case 'generateVideo': {
                        const videoPrompt = args.prompt as string;
                        const operation = await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt: videoPrompt, config: { numberOfVideos: 1 } });
                        results.push({ type: 'video_generation_start', operation, prompt: videoPrompt, message: `He comenzado a generar un video de: "${videoPrompt}". Esto puede tardar unos momentos.` });
                        break;
                    }
                    case 'getSystemStatus':
                        results.push({ type: 'app', appType: AppType.SYSTEM_STATUS, title: 'System Status', content: {}, message: 'Aquí está el estado actual del sistema.', size: { width: 600, height: 400 } });
                        break;
                    case 'changeTheme':
                        const theme = {
                            description: args.description as string, backgroundColor: args.backgroundColor as string,
                            textColor: args.textColor as string, primaryColor: args.primaryColor as string,
                        };
                        results.push({ type: 'theme_change', theme: theme, message: `¡Tema actualizado! ${theme.description}` });
                        break;
                    case 'changeBackground':
                         results.push({
                            type: 'background_generation_start',
                            prompt: args.prompt as string,
                            message: `Estoy cambiando el fondo a una imagen de: "${args.prompt}".`,
                        });
                        break;
                    case 'generateVideoBackground': {
                        const videoPrompt = args.prompt as string;
                        const operation = await ai.models.generateVideos({
                            model: 'veo-3.1-fast-generate-preview', prompt: videoPrompt, config: { numberOfVideos: 1 }
                        });
                        results.push({ type: 'video_background_generation_start', operation, prompt: videoPrompt, message: `He comenzado a generar un fondo de video de: "${videoPrompt}". Esto puede tardar un momento.` });
                        break;
                    }
                    case 'changeCursor':
                        results.push({ type: 'cursor_change', svg: args.svgString as string, message: `Cursor cambiado a: ${args.description as string}.` });
                        break;
                     case 'webSearch': {
                        const { uiPayload } = await handleWebSearch(args.query as string);
                        results.push(uiPayload);
                        break;
                    }
                    case 'orchestrateWorkflow': {
                         const { initialTask, dependentTaskPrompt } = args as any;
                         const initialTaskName = initialTask.name as string;
                         const initialTaskArgs = initialTask.args as any;

                         let rawResultData = '';
                         if (initialTaskName === 'webSearch') {
                             const { uiPayload, rawData } = await handleWebSearch(initialTaskArgs.query as string);
                             results.push(uiPayload); 
                             rawResultData = rawData.summary;
                         }
                         
                         if (rawResultData) {
                             const nextCommand = (dependentTaskPrompt as string).replace('{{RESULT}}', rawResultData);
                             const subsequentResults = await processCommand(nextCommand, chat);
                             results.push(...subsequentResults);
                         }
                         break;
                    }
                    case 'createAgent': {
                        const newAgent: Agent = {
                            id: `agent-${Date.now()}`,
                            name: args.name as string,
                            prompt: args.prompt as string,
                            trigger: AgentTrigger.SCHEDULE,
                            schedule: args.schedule as string,
                            lastRun: 0,
                            isEnabled: true
                        };
                        results.push({ type: 'agent_create', agent: newAgent, message: `He creado el agente "${newAgent.name}".`});
                        break;
                    }
                }
            }
             if (results.length > 0) return results;
        }
        
        return [{ type: 'text', content: response.text, message: response.text }];

    } catch (error) {
        console.error('Gemini API Error in processCommand:', error);
        throw error;
    }
};