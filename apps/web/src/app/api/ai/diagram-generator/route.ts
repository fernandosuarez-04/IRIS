import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        const { prompt, type } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt requerido' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

        const systemPrompt = `
            Actúa como un Arquitecto de Software experto. Tu tarea es generar código de diagramas usando la sintaxis de Mermaid.js.
            
            El usuario te pedirá un diagrama de tipo: ${type || 'Cualquiera adecuado'}.
            Descripción: "${prompt}"

            REGLAS IMPORTANTES:
            1. Responde ÚNICAMENTE con el código Mermaid.
            2. NO incluyas bloques de markdown (como \`\`\`mermaid). Devuelve SOLO el código plano.
            3. Si es un diagrama de clases o ER, usa sintaxis estándar.
            4. Asegúrate de que la sintaxis sea válida para evitar errores de renderizado.
            
            Ejemplo de output válido para un grafo simple:
            graph TD
                A[Inicio] --> B{¿Es válido?}
                B -- Sí --> C[Procesar]
                B -- No --> D[Terminar]
        `;

        const result = await model.generateContent(systemPrompt);
        const text = result.response.text();
        
        // Limpieza extra por seguridad
        const cleanCode = text
            .replace(/```mermaid/g, '')
            .replace(/```/g, '')
            .trim();

        return NextResponse.json({ code: cleanCode });

    } catch (error: any) {
        console.error('Diagram Gen Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
