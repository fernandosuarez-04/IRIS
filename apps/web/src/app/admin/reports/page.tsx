'use client';

import React, { useState, useEffect } from 'react';
import { useTheme, themeColors } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';

// --- STYLES FOR PDF ---
const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 30, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 4 },
  section: { margin: 10, padding: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#00D4B3' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingVertical: 5 },
  label: { width: '40%', fontSize: 10, color: '#555' },
  value: { width: '60%', fontSize: 10, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#AAA' }
});

// --- PDF TEMPLATE: Executive Summary ---
const ExecutiveReport = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>IRIS Executive Summary</Text>
        <Text style={styles.subtitle}>Generado el {new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Métricas Globales</Text>
        <View style={styles.row}><Text style={styles.label}>Total de Proyectos</Text><Text style={styles.value}>{data.projects.total}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Proyectos Activos</Text><Text style={styles.value}>{data.projects.active}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Tareas Totales</Text><Text style={styles.value}>{data.tasks.total}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Tasa de Finalización</Text><Text style={styles.value}>{Math.round((data.tasks.completed / data.tasks.total) * 100 || 0)}%</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Análisis de Riesgos</Text>
        <Text style={{ fontSize: 10, color: '#444', lineHeight: 1.5 }}>
           Basado en la actividad reciente, el equipo mantiene un ritmo constante. 
           Se recomienda revisar los {data.projects.total - data.projects.completed} proyectos pendientes para asegurar el cumplimiento de fechas.
        </Text>
      </View>

      <Text style={styles.footer}>Documento confidencial generado por IRIS System v1.0</Text>
    </Page>
  </Document>
);

// --- PDF TEMPLATE: Predictive Report (AI) ---
const PredictiveReport = ({ data, analysis }: { data: any, analysis: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
        <View style={styles.header}>
            <Text style={styles.title}>IRIS Predictive Intelligence</Text>
            <Text style={{ fontSize: 10, color: '#00D4B3', fontWeight: 'bold' }}>POWERED BY ARIA AI</Text>
            <Text style={styles.subtitle}>Generado el {new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evaluación de Riesgo: {analysis?.risk_level || 'N/A'}</Text>
            <Text style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>{analysis?.risk_summary || 'No risk summary available.'}</Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proyecciones Futuras (Escenarios)</Text>
            {analysis?.predictions?.map((p: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 5 }}>
                    <Text style={{ width: 15, color: '#666' }}>•</Text>
                    <Text style={{ flex: 1, fontSize: 10, color: '#333' }}>{p}</Text>
                </View>
            ))}
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recomendaciones Tácticas</Text>
            {analysis?.actions?.map((a: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 5 }}>
                    <Text style={{ width: 15, color: '#00D4B3', fontWeight: 'bold' }}>{i + 1}.</Text>
                    <Text style={{ flex: 1, fontSize: 10, color: '#333' }}>{a}</Text>
                </View>
            ))}
        </View>
        
        <View style={{ position: 'absolute', bottom: 30, left: 30, right: 30, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 }}>
            <Text style={{ fontSize: 8, color: '#999', textAlign: 'center' }}>
                Este reporte fue generado por inteligencia artificial. Las proyecciones son estimaciones basadas en datos históricos.
            </Text>
        </View>
    </Page>
  </Document>
);

// --- CSV GENERATOR (Fixed) ---
const downloadCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); // FIX: Append to body required for some browsers
    a.click();
    document.body.removeChild(a); // Cleanup
    window.URL.revokeObjectURL(url);
};

export default function ReportsPage() {
    const { isDark } = useTheme();
    const colors = isDark ? themeColors.dark : themeColors.light;
    const [isMounted, setIsMounted] = useState(false); // Fix hydration mismatch for PDF
    
    const [aiLoading, setAiLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Mock Data for Reports (In real app, fetch from filters)
    const mockReportData = {
        projects: { total: 12, active: 4, completed: 8 },
        tasks: { total: 124, completed: 65 }
    };
    const mockCSVData = [
        { id: 'T-101', title: 'Implement Auth', status: 'Done', assignee: 'Fernando' },
        { id: 'T-102', title: 'Design Database', status: 'Done', assignee: 'Sofia' },
        { id: 'T-103', title: 'Fix Login Bug', status: 'In Progress', assignee: 'Dev' },
    ];

    const generatePredictiveReport = async () => {
        setAiLoading(true);
        try {
            const res = await fetch('/api/ai/predictive-report', { method: 'POST' });
            if (res.ok) {
                const json = await res.json();
                setAiAnalysis(json);
            } else {
                alert('No se pudo conectar con ARIA.');
            }
        } catch (e) { console.error(e); }
        finally { setAiLoading(false); }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen animate-fadeIn space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">Centro de Reportes</h1>
                <p className="opacity-60">Genera, previsualiza y descarga informes detallados.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. EXECUTIVE SUMMARY CARD */}
                <div className="p-6 rounded-2xl border bg-white dark:bg-[#161b22] border-gray-200 dark:border-white/5 shadow-sm hover:border-blue-500 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Resumen Ejecutivo</h3>
                    <p className="text-sm opacity-60 mb-6">Informe PDF de alto nivel con métricas clave de rendimiento y estado de cartera.</p>
                    
                    {isMounted ? (
                        <PDFDownloadLink 
                            document={<ExecutiveReport data={mockReportData} />} 
                            fileName={`IRIS_Executive_Summary_${new Date().toISOString().split('T')[0]}.pdf`}
                            className="flex items-center justify-center w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
                        >
                            {({ loading }) => (loading ? 'Generando PDF...' : 'Descargar PDF')}
                        </PDFDownloadLink>
                    ) : (
                        <div className="w-full py-3 rounded-xl bg-gray-200 dark:bg-zinc-800 text-center text-sm opacity-50">Cargando PDF...</div>
                    )}
                </div>

                {/* 2. TASK EXPORT CARD */}
                <div className="p-6 rounded-2xl border bg-white dark:bg-[#161b22] border-gray-200 dark:border-white/5 shadow-sm hover:border-green-500 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Exportar Tareas</h3>
                    <p className="text-sm opacity-60 mb-6">Listado completo de tareas en formato CSV compatible con Excel o Sheets.</p>
                    
                    <button 
                        onClick={() => downloadCSV(mockCSVData, 'iris_tasks_export.csv')}
                        className="flex items-center justify-center w-full py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 font-medium transition-all"
                    >
                        Descargar CSV
                    </button>
                </div>

                {/* 3. AI PREDICTIVE REPORT (ENABLED) */}
                <div className="p-6 rounded-2xl border bg-white dark:bg-[#161b22] border-gray-200 dark:border-white/5 shadow-sm hover:border-[#00D4B3] transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-[#00D4B3]/10 text-[#00D4B3] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Análisis Predictivo IA</h3>
                    <p className="text-sm opacity-60 mb-6">ARIA analiza patrones, detecta bloqueos futuros y sugiere mejoras estratégicas.</p>
                    
                    {!aiAnalysis ? (
                        <button 
                            onClick={generatePredictiveReport}
                            disabled={aiLoading}
                            className="flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-200 text-white dark:text-black font-bold hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {aiLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Analizando...
                                </span>
                            ) : (
                                'Generar Análisis'
                            )}
                        </button>
                    ) : (
                        isMounted ? (
                        <PDFDownloadLink 
                            document={<PredictiveReport data={null} analysis={aiAnalysis} />} 
                            fileName={`IRIS_AI_Analysis_${new Date().toISOString().split('T')[0]}.pdf`}
                            className="flex items-center justify-center w-full py-3 rounded-xl bg-[#00D4B3] hover:bg-[#00bda0] text-black font-bold transition-all animate-bounce-subtle"
                        >
                            {({ loading }) => (loading ? 'Creando PDF...' : '⬇ Descargar Reporte ARIA')}
                        </PDFDownloadLink>
                        ) : null
                    )}
                </div>

            </div>

            {/* PREVIEW SECTION (Optional Future Feature) */}
            <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-500 rounded-lg text-white mt-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900 dark:text-blue-100">Consejo Profesional</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Puedes conectar IRIS con herramientas de BI externas usando la API de exportación para análisis más profundos. Por ahora, el Resumen Ejecutivo cubre los KPIs más importantes para stakeholders.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
