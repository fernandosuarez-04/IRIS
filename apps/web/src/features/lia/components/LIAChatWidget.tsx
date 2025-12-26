'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

interface ARIAChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userRole?: string;
  userId?: string;
  teamId?: string;
}

// Quick action suggestions (text only, no emojis)
const QUICK_ACTIONS = [
  { label: '¿Qué puedes hacer?', message: '¿Qué puedes hacer?' },
  { label: 'Ver mis tareas', message: 'Muéstrame mis tareas pendientes' },
  { label: 'Estado del proyecto', message: '¿Cuál es el estado de mi proyecto?' },
  { label: 'Crear tarea', message: 'Quiero crear una nueva tarea' },
];

export function LIAChatWidget({ isOpen, onClose, userName, userRole, userId, teamId }: ARIAChatWidgetProps) {
  const { isDark } = useTheme();
  
  // SOFIA Design System Colors - Dynamic based on theme
  const COLORS = {
    primary: '#0A2540',
    accent: '#00D4B3',
    success: '#10B981',
    warning: '#F59E0B',
    
    // Dynamic colors
    bgPrimary: isDark ? '#0F1419' : '#FFFFFF',
    bgSecondary: isDark ? '#1E2329' : '#F3F4F6',
    bgTertiary: isDark ? '#0A0D12' : '#F9FAFB',
    
    // Text colors
    textPrimary: isDark ? '#FFFFFF' : '#111827',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    textInverse: isDark ? '#000000' : '#FFFFFF',
    
    // Borders & UI
    border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    white: '#FFFFFF', // Mantener para casos específicos donde siempre se necesita blanco
    
    // Specific UI elements
    inputBg: isDark ? '#1E2329' : '#FFFFFF',
    bubbleUser: 'linear-gradient(135deg, #00D4B3, #0A2540)',
    bubbleAssistant: isDark ? '#1E2329' : '#F3F4F6',
    backdrop: isDark ? 'rgba(10, 13, 18, 0.5)' : 'rgba(0, 0, 0, 0.2)',
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- VOICE INPUT LOGIC ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceInput = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Tu navegador no soporta dictado por voz (Prueba Chrome/Edge).");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
        const options = event.results[event.results.length - 1];
        const transcript = options[0].transcript;
        
        if (options.isFinal) {
             setInput(prev => {
                 const spacer = prev && !prev.endsWith(' ') ? ' ' : '';
                 return prev + spacer + transcript;
             });
        }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };
  // -------------------------

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `¡Hola${userName ? ` ${userName}` : ''}! 👋 Soy **ARIA**, tu asistente de IRIS.\n\nPuedo ayudarte a gestionar proyectos, tareas y equipos. ¿En qué te puedo ayudar?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, userName]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        const base64Content = base64Data.split(',')[1];
        
        setAttachments(prev => [...prev, {
            name: file.name,
            mimeType: file.type,
            data: base64Content
        }]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    const currentAttachments = [...attachments];
    
    if ((!textToSend && currentAttachments.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const chatMessages = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ 
            role: m.role, 
            content: m.content,
            attachments: m.attachments 
        }));
      
      chatMessages.push({ 
          role: 'user' as const, 
          content: userMessage.content,
          attachments: userMessage.attachments
      });

      const response = await fetch('/api/lia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          context: {
            userName,
            userRole,
            userId,
            teamId,
            currentPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
          },
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al conectar con ARIA');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = `assistant-${Date.now()}`;

      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  assistantContent += data.content;
                  setMessages(prev => 
                    prev.map(m => 
                      m.id === assistantId 
                        ? { ...m, content: assistantContent }
                        : m
                    )
                  );
                }
              } catch {
                // Ignorar errores de parsing
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (message: string) => {
    sendMessage(message);
  };

  const clearConversation = () => {
    setMessages([]);
    setInput('');
    setAttachments([]);
  };

  const showQuickActions = input.trim() === '' && attachments.length === 0 && !isLoading && messages.length <= 1;

  // Determine button state
  const hasContent = input.trim().length > 0 || attachments.length > 0;
  // Send mode if not listening AND (has content OR is loading to show spinner maybe? no send button disables on load)
  // Logic: 
  // 1. Listening? -> ACTION: Stop Rec. Icon: Stop. Color: Red.
  // 2. Has Content? -> ACTION: Send. Icon: Arrow. Color: Gradient.
  // 3. Empty? -> ACTION: Start Rec. Icon: Mic. Color: Grey.
  const showSendMode = !isListening && hasContent;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-16 right-0 w-[420px] max-w-[95vw] z-40 flex flex-col"
            style={{ 
              height: 'calc(100vh - 64px)', 
              backgroundColor: COLORS.bgPrimary,
              borderLeft: `1px solid ${COLORS.border}`,
              boxShadow: isDark ? '-4px 0 20px rgba(0,0,0,0.3)' : '-4px 0 20px rgba(0,0,0,0.1)',
            }}
          >
              <div 
              className="mx-3 mt-3 px-5 py-4 flex items-center justify-between rounded-2xl"
              style={{ 
                background: isDark 
                  ? `linear-gradient(135deg, ${COLORS.accent}20, ${COLORS.primary}30)`
                  : `linear-gradient(135deg, ${COLORS.accent}10, #FFFFFF)`,
                border: isDark ? `1px solid ${COLORS.accent}30` : `1px solid ${COLORS.border}`,
                boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.05)'
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primary})`,
                    boxShadow: `0 4px 20px ${COLORS.accent}40`
                  }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: COLORS.textPrimary }}>ARIA</h3>
                  <span className="text-xs flex items-center gap-1.5" style={{ color: COLORS.accent }}>
                    <span 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: COLORS.success }}
                    ></span>
                    Asistente IA • En línea
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {messages.length > 1 && (
                  <button
                    onClick={clearConversation}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                    style={{ 
                      backgroundColor: isDark ? `${COLORS.textPrimary}10` : 'rgba(0,0,0,0.05)',
                      color: COLORS.textSecondary
                    }}
                    title="Limpiar conversación"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                  style={{ 
                    backgroundColor: isDark ? `${COLORS.textPrimary}10` : 'rgba(0,0,0,0.05)',
                    color: COLORS.textSecondary
                  }}
                  title="Cerrar"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ scrollbarWidth: 'thin', scrollbarColor: `${COLORS.textSecondary} transparent` }}
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className="max-w-[85%] rounded-2xl px-4 py-3"
                    style={message.role === 'user' 
                      ? { 
                          background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primary})`,
                          color: COLORS.white
                        }
                      : { 
                          backgroundColor: COLORS.bubbleAssistant,
                          color: COLORS.textPrimary,
                          border: `1px solid ${COLORS.border}`
                        }
                    }
                  >
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {message.attachments.map((att, i) => (
                                <div key={i} className="relative group">
                                    {att.mimeType.startsWith('image/') ? (
                                        <img 
                                            src={`data:${att.mimeType};base64,${att.data}`} 
                                            alt={att.name}
                                            className="h-20 w-auto rounded-lg object-cover border border-white/20"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 flex items-center justify-center bg-black/20 rounded-lg text-xs p-1 text-center break-words">
                                            {att.name}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content.split('**').map((part, i) => 
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                      )}
                    </div>
                    <div 
                      className="text-xs mt-2"
                      style={{ color: message.role === 'user' ? 'rgba(255,255,255,0.8)' : COLORS.textSecondary }}
                    >
                      {message.timestamp.toLocaleTimeString('es-MX', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: COLORS.bubbleAssistant, border: `1px solid ${COLORS.border}` }}>
                    <div className="flex space-x-2">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: COLORS.accent, animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: COLORS.accent, animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: COLORS.accent, animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <AnimatePresence>
              {showQuickActions && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="px-4 pb-2"
                  style={{ backgroundColor: COLORS.bgPrimary }}
                >
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS.map((action, index) => (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleQuickAction(action.message)}
                        className="px-3 py-2 rounded-xl text-left transition-all flex items-center gap-2"
                        style={{ 
                          backgroundColor: COLORS.bgSecondary,
                          border: `1px solid ${COLORS.border}`,
                          color: COLORS.textPrimary
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = COLORS.accent;
                          e.currentTarget.style.backgroundColor = `${COLORS.accent}15`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = COLORS.border;
                          e.currentTarget.style.backgroundColor = COLORS.bgSecondary;
                        }}
                      >
                        <span className="text-xs font-medium">{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div 
              className="p-4"
              style={{ 
                backgroundColor: COLORS.bgTertiary,
                borderTop: `1px solid ${COLORS.border}`
              }}
            >
               {/* Attachments Preview Area */}
               <AnimatePresence>
                {attachments.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2 mb-3 overflow-x-auto pb-2"
                    >
                        {attachments.map((att, index) => (
                            <div key={index} className="relative flex-shrink-0 group">
                                {att.mimeType.startsWith('image/') ? (
                                    <div className="h-16 w-16 rounded-lg overflow-hidden border border-gray-500 relative">
                                         <img src={`data:${att.mimeType};base64,${att.data}`} className="h-full w-full object-cover" alt="preview" />
                                    </div>
                                ) : (
                                    <div className="h-16 w-16 bg-gray-700 rounded-lg flex items-center justify-center text-xs p-1 text-center">
                                        📄
                                    </div>
                                )}
                                <button 
                                    onClick={() => removeAttachment(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </motion.div>
                )}
               </AnimatePresence>

              <div className="flex items-center gap-3">
                {/* File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect} 
                    accept="image/*,application/pdf"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-opacity-80 flex-shrink-0"
                    style={{ backgroundColor: COLORS.bgSecondary, border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary }}
                    title="Adjuntar archivo o imagen"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={isListening ? "Escuchando..." : "Escribe un mensaje a ARIA..."}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl text-sm transition-all outline-none"
                  style={{ 
                    backgroundColor: COLORS.inputBg,
                    color: COLORS.textPrimary,
                    border: `1px solid ${isListening ? '#EF4444' : COLORS.border}`,
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = COLORS.accent}
                  onBlur={(e) => e.currentTarget.style.borderColor = COLORS.border}
                />
                
                {/* Unified Action Button (Send/Mic) */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                      if (isLoading) return;
                      if (isListening) toggleVoiceInput(); // ACTION: STOP LISTENING
                      else if (showSendMode) sendMessage(); // ACTION: SEND
                      else toggleVoiceInput(); // ACTION: START LISTENING
                  }}
                  disabled={isLoading}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${isListening ? 'animate-pulse' : ''}`}
                  style={{ 
                    background: isListening
                        ? '#EF4444' // Red when listening/stopping
                        : showSendMode
                            ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primary})` // Gradient when ready to send
                            : COLORS.bgSecondary, // Grey when empty (Mic mode)
                    boxShadow: showSendMode && !isListening
                      ? `0 4px 15px ${COLORS.accent}40`
                      : 'none',
                    color: isListening || showSendMode ? '#FFFFFF' : COLORS.textSecondary,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    border: showSendMode || isListening ? 'none' : `1px solid ${COLORS.border}`
                  }}
                  title={isListening ? "Detener grabación" : showSendMode ? "Enviar mensaje" : "Dictar por voz"}
                >
                  {isListening ? (
                    // Stop Icon
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                         <rect x="7" y="7" width="10" height="10" rx="2" />
                    </svg>
                  ) : showSendMode ? (
                     // Send Icon (Paper Plane Right)
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                     </svg>
                  ) : (
                     // Mic Icon
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                     </svg>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { LIAChatWidget as ARIAChatWidget };
export default LIAChatWidget;
