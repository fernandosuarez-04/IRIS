'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

// --- ICONS ---
const Icons = {
    Bell: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    Link: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    Server: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
    Key: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    Activity: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    CheckCircle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    Terminal: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
    Zap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
};

// --- COMPONENTS ---

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
        onClick={onChange}
        className={`w-12 h-6 rounded-full p-1 transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
    >
        <motion.div 
            layout 
            className="w-4 h-4 rounded-full bg-white shadow-sm"
            animate={{ x: checked ? 24 : 0 }}
        />
    </button>
);

const SectionTitle = ({ title, sub }: { title: string, sub: string }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm opacity-60">{sub}</p>
    </div>
);

// --- PANELS ---

const NotificationsPanel = () => {
    const [settings, setSettings] = useState({ email: true, push: false });
    const toggle = (k: keyof typeof settings) => setSettings(p => ({ ...p, [k]: !p[k] }));

    return (
        <div className="space-y-8 animate-fadeIn">
            <SectionTitle title="Notificaciones" sub="Elige qué alertas quieres recibir." />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium">Resumen Diario Email</h3>
                        <p className="text-sm opacity-60">Recibe un resumen de tus tareas pendientes a las 9:00 AM.</p>
                    </div>
                    <Toggle checked={settings.email} onChange={() => toggle('email')} />
                </div>
                <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
                
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium">Notificaciones Push</h3>
                        <p className="text-sm opacity-60">Alertas en tiempo real cuando te mencionan o asignan tareas.</p>
                    </div>
                    <Toggle checked={settings.push} onChange={() => toggle('push')} />
                </div>
            </div>
        </div>
    );
};

const ConnectedAccountsPanel = () => {
    return (
        <div className="space-y-8 animate-fadeIn">
            <SectionTitle title="Cuentas Conectadas" sub="Gestiona tus inicios de sesión sociales." />
            
            <div className="space-y-4">
                {/* Google */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                            <span className="font-bold text-[#EA4335]">G</span>
                        </div>
                        <div>
                            <h3 className="font-medium">Google</h3>
                            <p className="text-xs opacity-60">fernando@iris.com</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Icons.CheckCircle />
                        <span className="text-sm font-medium opacity-60">Conectado</span>
                    </div>
                </div>

                {/* GitHub */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center border border-gray-100 shadow-sm">
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> 
                        </div>
                        <div>
                            <h3 className="font-medium">GitHub</h3>
                            <p className="text-xs opacity-60">No conectado</p>
                        </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        Conectar
                    </button>
                </div>
            </div>
        </div>
    );
};

const MCPServersPanel = () => {
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [payload, setPayload] = useState<any>(null);

    const BRIDGE_URL = typeof window !== 'undefined' ? `${window.location.origin}/api/ai/bridge` : 'http://localhost:3000/api/ai/bridge';
    const AGENT_KEY = 'iris-default-secret-key'; // Match the one in route.ts

    const testConnection = async () => {
        setConnectionStatus('testing');
        try {
            const res = await fetch('/api/ai/bridge', {
                headers: { 'Authorization': `Bearer ${AGENT_KEY}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPayload(data);
                setConnectionStatus('success');
            } else {
                setConnectionStatus('error');
            }
        } catch (e) {
            setConnectionStatus('error');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado al portapapeles');
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-start">
                <SectionTitle title="IRIS Core Link" sub="Bridge API: Conexión directa y segura para Agentes (Antigravity/ARIA)." />
                <div className="flex gap-2">
                     <button 
                        onClick={testConnection}
                        disabled={connectionStatus === 'testing'}
                        className="px-4 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 font-bold rounded-lg text-sm transition-colors"
                    >
                        {connectionStatus === 'testing' ? 'Verificando...' : 'Test Conexión'}
                    </button>
                    <button className="px-4 py-2 bg-[#00D4B3] text-black font-bold rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center gap-2">
                        <Icons.Zap />
                        Conectar IDE
                    </button>
                </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-black text-white border border-gray-800 shadow-xl relative overflow-hidden group">
                <div className={`absolute top-0 right-0 p-32 blur-[150px] opacity-20 transition-colors duration-500 ${connectionStatus === 'success' ? 'bg-green-500' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-[#00D4B3]'}`}></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                            <span className="text-3xl">🌌</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">IRIS Bridge Endpoint</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full shadow-[0_0_10px] ${connectionStatus === 'success' ? 'bg-green-500 shadow-green-500' : connectionStatus === 'error' ? 'bg-red-500 shadow-red-500' : 'bg-gray-500'}`}></span>
                                <span className="text-sm font-mono text-gray-300">
                                    {connectionStatus === 'success' ? 'LINK ESTABLISHED' : connectionStatus === 'error' ? 'CONNECTION FAILED' : 'STANDBY'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-black/40 rounded-lg p-3 border border-white/10 flex items-center justify-between">
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold tracking-wider">Endpoint URL</label>
                                <p className="font-mono text-sm text-[#00D4B3]">{BRIDGE_URL}</p>
                            </div>
                            <button onClick={() => copyToClipboard(BRIDGE_URL)} className="p-2 hover:bg-white/10 rounded">
                                <Icons.Server />
                            </button>
                        </div>

                        <div className="bg-black/40 rounded-lg p-3 border border-white/10 flex items-center justify-between">
                            <div>
                                <label className="text-xs uppercase text-gray-500 font-bold tracking-wider">Agent Key (Bearer Token)</label>
                                <p className="font-mono text-sm text-yellow-400">•••••••••••••••••••••</p>
                            </div>
                            <button onClick={() => copyToClipboard(AGENT_KEY)} className="p-2 hover:bg-white/10 rounded">
                                <Icons.Key />
                            </button>
                        </div>
                    </div>

                    {connectionStatus === 'success' && payload && (
                        <div className="mt-6 p-4 bg-black/50 rounded-lg border border-green-500/30 animate-fadeIn">
                            <p className="text-xs text-green-400 font-bold mb-2">✓ CONEXIÓN VERIFICADA - CONTEXTO RECIBIDO:</p>
                            <pre className="text-[10px] font-mono text-gray-400 overflow-hidden">
                                {JSON.stringify({
                                    status: payload.system_status,
                                    projects: payload.database.stats.projects_count,
                                    tasks: payload.database.stats.tasks_count,
                                    environment: payload.environment
                                }, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 text-sm">
                <p className="font-bold text-blue-800 dark:text-blue-200 mb-2">Instrucciones para Antigravity / Cursor:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
                    <li>Copia la <b>Endpoint URL</b> y la <b>Agent Key</b>.</li>
                    <li>Configura tu agente para usar un header <code>Authorization: Bearer [KEY]</code>.</li>
                    <li>Realiza un <code>GET</code> para leer el contexto actual del sistema.</li>
                    <li>Utiliza el contexto devuelto para tomar decisiones informadas sobre el código.</li>
                </ol>
            </div>
        </div>
    );
};

const SecurityPanel = () => {
    return (
        <div className="space-y-8 animate-fadeIn">
            <SectionTitle title="Seguridad" sub="Protege tu cuenta y revisa accesos recientes." />
            
            <div className="p-6 border border-gray-200 dark:border-white/5 rounded-xl bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Icons.Key /></div>
                    <div>
                        <h3 className="font-bold">Cambiar Contraseña</h3>
                        <p className="text-sm opacity-60">Se recomienda usar una contraseña segura de al menos 12 caracteres.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="password" placeholder="Contraseña Actual" className="px-4 py-2 rounded-lg bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none focus:border-blue-500" />
                    <input type="password" placeholder="Nueva Contraseña" className="px-4 py-2 rounded-lg bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 outline-none focus:border-blue-500" />
                </div>
                <div className="mt-4 flex justify-end">
                    <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg text-sm hover:opacity-80">
                        Actualizar Password
                    </button>
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Icons.Activity />
                    <h3 className="font-bold">Actividad Reciente</h3>
                </div>
                <div className="border border-gray-200 dark:border-white/5 rounded-xl divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                    {[
                        { action: 'Inicio de sesión exitoso', device: 'Chrome on Windows', ip: '192.168.1.1', time: 'Hace 2 minutos' },
                        { action: 'Cambio de configuración', device: 'Chrome on Windows', ip: '192.168.1.1', time: 'Hace 1 hora' },
                        { action: 'Reporte descargado', device: 'Chrome on Windows', ip: '192.168.1.1', time: 'Ayer' },
                    ].map((log, i) => (
                        <div key={i} className="p-4 flex justify-between items-center text-sm">
                            <div>
                                <p className="font-medium">{log.action}</p>
                                <p className="text-xs opacity-50">{log.device} • {log.ip}</p>
                            </div>
                            <span className="text-xs opacity-40">{log.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('notifications');
    const { isDark } = useTheme();

    const tabs = [
        { id: 'notifications', label: 'Notificaciones', icon: <Icons.Bell /> },
        { id: 'accounts', label: 'Cuentas Conectadas', icon: <Icons.Link /> },
        { id: 'mcp', label: 'IRIS Core Link (MCP)', icon: <Icons.Server /> },
        { id: 'security', label: 'Seguridad', icon: <Icons.Shield /> },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Configuración</h1>
                <p className="opacity-60">Gestiona tus preferencias, conexiones MCP y seguridad.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* SIDEBAR TABS */}
                <div className="w-full lg:w-64 flex-shrink-0 space-y-1">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                    isActive 
                                    ? 'bg-white dark:bg-[#161b22] shadow-sm text-blue-600 dark:text-blue-400' 
                                    : 'hover:bg-gray-100 dark:hover:bg-white/5 opacity-70 hover:opacity-100'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                                {isActive && <motion.div layoutId="active-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                            </button>
                        );
                    })}
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-8 min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'notifications' && <NotificationsPanel key="notif" />}
                        {activeTab === 'accounts' && <ConnectedAccountsPanel key="accounts" />}
                        {activeTab === 'mcp' && <MCPServersPanel key="mcp" />}
                        {activeTab === 'security' && <SecurityPanel key="security" />}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
