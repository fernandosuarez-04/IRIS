'use client';

import { useState, useEffect } from 'react';

interface APIStatus {
  status: string;
  model: string | null;
  message: string;
}

export default function LIATestPage() {
  const [apiStatus, setApiStatus] = useState<APIStatus | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar estado del API al cargar
  useEffect(() => {
    checkAPIStatus();
  }, []);

  const checkAPIStatus = async () => {
    try {
      const res = await fetch('/api/lia/chat');
      const data = await res.json();
      setApiStatus(data);
    } catch (err) {
      setError('Error al verificar el estado de la API');
      console.error(err);
    }
  };

  const sendTestMessage = async () => {
    if (!testMessage.trim()) return;
    
    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/lia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: testMessage }],
          stream: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error en la solicitud');
      }

      const data = await res.json();
      setResponse(data.message.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          🧪 LIA Test Page
        </h1>

        {/* API Status Card */}
        <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${apiStatus?.status === 'ready' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
            Estado de la API
          </h2>
          
          {apiStatus ? (
            <div className="space-y-2">
              <p><strong>Estado:</strong> {apiStatus.status}</p>
              <p><strong>Modelo:</strong> {apiStatus.model || 'No configurado'}</p>
              <p><strong>Mensaje:</strong> {apiStatus.message}</p>
            </div>
          ) : (
            <p className="text-slate-400">Verificando...</p>
          )}

          <button
            onClick={checkAPIStatus}
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            Verificar de nuevo
          </button>
        </div>

        {/* Test Form */}
        <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Probar LIA</h2>
          
          <div className="space-y-4">
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Escribe un mensaje de prueba para LIA..."
              className="w-full h-32 bg-slate-700/50 border border-slate-600 rounded-xl p-4 
                         text-white placeholder-slate-400 resize-none focus:outline-none 
                         focus:border-cyan-500 transition-colors"
            />

            <button
              onClick={sendTestMessage}
              disabled={isLoading || !testMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 
                         hover:from-cyan-400 hover:to-purple-500
                         disabled:from-slate-600 disabled:to-slate-600
                         rounded-xl font-medium transition-all"
            >
              {isLoading ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
              ❌ {error}
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="mt-4 p-4 bg-slate-700/50 border border-slate-600 rounded-xl">
              <h3 className="text-sm text-cyan-400 mb-2 font-semibold">Respuesta de LIA:</h3>
              <p className="text-slate-200 whitespace-pre-wrap">{response}</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">📋 Configuración requerida</h2>
          <p className="text-slate-300 mb-4">
            Asegúrate de tener las siguientes variables en tu archivo <code className="bg-slate-700 px-2 py-1 rounded">.env.local</code>:
          </p>
          <pre className="bg-slate-900 p-4 rounded-xl overflow-x-auto text-sm">
{`# Gemini Configuration
GOOGLE_API_KEY=tu-api-key-de-google
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_MAX_TOKENS=8192
GEMINI_TEMPERATURE=0.6
GEMINI_THINKING_LEVEL=high`}
          </pre>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <a 
            href="/"
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
