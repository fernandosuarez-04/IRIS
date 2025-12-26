import { NextRequest, NextResponse } from 'next/server';
import { streamChatResponse, generateChatResponse, ChatMessage, geminiConfig } from '@/lib/ai/gemini';
import { getLIASystemPrompt, LIAContext } from '@/lib/ai/lia-agent';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ChatRequest {
  messages: ChatMessage[];
  context?: LIAContext;
  stream?: boolean;
}

export async function POST(request: NextRequest) {
  console.log('🔵 LIA Chat API - Request received');
  
  // Track streaming preference in outer scope for error handling
  let shouldStream = true;

  try {
    const body: ChatRequest = await request.json();
    const { messages, context, stream = true } = body;
    shouldStream = stream; // Update based on request

    console.log('📨 Messages count:', messages?.length);
    console.log('📨 Stream mode:', stream);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un mensaje' },
        { status: 400 }
      );
    }

    if (!geminiConfig.apiKey) {
      console.error('❌ GOOGLE_API_KEY no está configurada');
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY no está configurada en .env.local' },
        { status: 500 }
      );
    }

    // --- CONTEXT ENRICHMENT (DATA FETCHING) ---
    if (context?.userId && context?.teamId) {
      try {
         const { getSupabaseAdmin } = await import('@/lib/supabase/server');
         const supabase = getSupabaseAdmin();
         
         const { data: teamData } = await supabase.from('teams').select('name').eq('team_id', context.teamId).single();
         if (teamData?.name) context.teamName = teamData.name;

         const { data: tasks } = await supabase.from('task_issues')
            .select(`title, issue_number, status:task_statuses(name), priority:task_priorities(name), due_date`)
            .eq('team_id', context.teamId)
            .order('created_at', { ascending: false })
            .limit(20);
         if (tasks) context.tasks = tasks;

         const { data: projects } = await supabase.from('pm_projects')
            .select('project_name, project_status, project_key')
            .eq('team_id', context.teamId)
            .limit(5);
          if (projects) context.projects = projects;

      } catch (err) {
        console.error('⚠️ Error fetching real context data:', err);
      }
    }
    // ------------------------------------------

    // --- ATTACHMENT PERSISTENCE ---
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user' && lastMessage?.attachments && lastMessage.attachments.length > 0 && context?.userId) {
        try {
            console.log(`📎 Processing ${lastMessage.attachments.length} attachments for persistence...`);
            const { getSupabaseAdmin } = await import('@/lib/supabase/server');
            const supabase = getSupabaseAdmin();

            for (const att of lastMessage.attachments) {
                const buffer = Buffer.from(att.data, 'base64');
                const timestamp = Date.now();
                const safeName = (att.name || 'image').replace(/[^a-zA-Z0-9.-]/g, '_');
                const filePath = `${context.userId}/${timestamp}-${safeName}`;

                const { error: uploadError } = await supabase.storage.from('aria-attachments').upload(filePath, buffer, { contentType: att.mimeType, upsert: false });
                if (uploadError) { console.error('❌ Upload failed:', uploadError.message); continue; }

                const { data: urlData } = supabase.storage.from('aria-attachments').getPublicUrl(filePath);

                await supabase.from('aria_chat_attachments').insert({
                    user_id: context.userId, team_id: context.teamId, file_name: att.name || 'unknown',
                    file_type: att.mimeType, file_size: buffer.length, storage_path: filePath, public_url: urlData.publicUrl
                });
            }
        } catch (err) {
            console.error('⚠️ Attachment processing error:', err);
        }
    }
    // ------------------------------------------

    const systemPrompt = getLIASystemPrompt(context);

    // --- TOOL EXECUTION PREPARATION ---
    const { AriaToolHandlers } = await import('@/lib/ai/tools/handlers');
    const { ARIA_TOOLS_DEFINITIONS } = await import('@/lib/ai/tools/definitions');
    
    const toolHandlers = new AriaToolHandlers({
        userId: context?.userId || '',
        userRole: context?.userRole || 'viewer',
        teamId: context?.teamId || '',
        lastMessageAttachments: messages[messages.length - 1]?.attachments
    });

    const { getGeminiModel } = await import('@/lib/ai/gemini');
    const model = getGeminiModel();
    
    const history = messages.filter(m => m.role !== 'system').slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: m.role === 'user' && m.attachments ? 
            [{ text: m.content }, ...m.attachments.map(a => ({ inlineData: { mimeType: a.mimeType, data: a.data } }))] :
            [{ text: m.content }]
    }));

    const chatSession = model.startChat({
        history,
        tools: ARIA_TOOLS_DEFINITIONS as any,
        generationConfig: { maxOutputTokens: 8192 }
    });

    const lastMsg = messages[messages.length - 1];
    let msgParts: any[] = [{ text: lastMsg.content }];
    if (lastMsg.attachments) {
        lastMsg.attachments.forEach(a => msgParts.push({ inlineData: { mimeType: a.mimeType, data: a.data } }));
    }
    if (systemPrompt && msgParts[0].text) {
        msgParts[0].text = `${systemPrompt}\n\n---\n\n${msgParts[0].text}`;
    } else if (systemPrompt) {
        msgParts.unshift({ text: systemPrompt });
    }

    // --- EXECUTION LOOP ---
    let result = await chatSession.sendMessage(msgParts);
    let response = await result.response;
    let functionCalls = response.functionCalls();

    const MAX_TURNS = 5;
    let turn = 0;

    while (functionCalls && functionCalls.length > 0 && turn < MAX_TURNS) {
        turn++;
        console.log(`⚙️ Function Calls Detected (${functionCalls.length}):`, functionCalls.map(c => c.name));
        
        const toolResponses = [];
        for (const call of functionCalls) {
            try {
                let output;
                // @ts-ignore
                if (typeof toolHandlers[call.name] === 'function') {
                    // @ts-ignore
                    output = await toolHandlers[call.name](call.args);
                } else {
                    output = JSON.stringify({ error: `Tool ${call.name} not implemented.` });
                }
                toolResponses.push({ functionResponse: { name: call.name, response: { result: output } } });
            } catch (err: any) {
                toolResponses.push({ functionResponse: { name: call.name, response: { error: err.message } } });
            }
        }
        
        console.log('🔙 sending tool outputs back to model...');
        result = await chatSession.sendMessage(toolResponses);
        response = await result.response;
        functionCalls = response.functionCalls();
    }

    const finalContent = response.text();
    
    // --- USAGE TRACKING ---
    try {
        const usage = result.response.usageMetadata;
        if (usage && context?.userId) {
            // Non-blocking log
            const { getSupabaseAdmin } = await import('@/lib/supabase/server');
            const supabase = getSupabaseAdmin();
            supabase.from('aria_usage_logs').insert({
                user_id: context.userId,
                team_id: context.teamId,
                model: geminiConfig.model || 'unknown',
                input_tokens: usage.promptTokenCount || 0,
                output_tokens: usage.candidatesTokenCount || 0,
                total_tokens: usage.totalTokenCount || 0
            }).then(({ error }) => {
                if(error) console.error('Error logging usage:', error.message);
            });
        }
    } catch (e) {
        console.warn('Failed to track usage:', e);
    }
    // ---------------------
    
    if (shouldStream) {
         const encoder = new TextEncoder();
         const readable = new ReadableStream({
             start(controller) {
                 const text = finalContent;
                 const chunkSize = 100;
                 let i = 0;
                 function push() {
                     if (i >= text.length) {
                         controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                         controller.close();
                         return;
                     }
                     const chunk = text.slice(i, i + chunkSize);
                     controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`));
                     i += chunkSize;
                     setTimeout(push, 10);
                 }
                 push();
             }
         });
         return new Response(readable, { headers: { 'Content-Type': 'text/event-stream' } });
    } else {
        return NextResponse.json({ message: { role: 'assistant', content: finalContent } });
    }

  } catch (error) {
    console.error('❌ LIA Chat API error:', error);
    
    let errorMessage = 'Error interno del servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error stack:', error.stack);
    }
    
    if (errorMessage.includes('API_KEY')) {
      errorMessage = 'La API de Google Gemini no está configurada correctamente';
    } else if (errorMessage.includes('model')) {
      errorMessage = `Error con el modelo: ${geminiConfig.model}.`;
    } else if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
        const politeMessage = "⏳ Lo siento, he alcanzado mi límite de capacidad. Por favor espera unos segundos. (Rate Limit)";
        console.warn('⚠️ Gemini Quota Exceeded (Handled)');
        
        if (shouldStream) {
            const encoder = new TextEncoder();
            const readable = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: politeMessage, done: false })}\n\n`));
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                    controller.close();
                }
            });
            return new Response(readable, { headers: { 'Content-Type': 'text/event-stream' } });
        } else {
             return NextResponse.json({ message: { role: 'assistant', content: politeMessage } });
        }
    }
    
    // FALLBACK RETURN (Restored)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
    return NextResponse.json({ status: 'ready', message: 'LIA (ARIA) Chat API Ready' });
}
