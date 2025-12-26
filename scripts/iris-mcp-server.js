#!/usr/bin/env node
/**
 * IRIS MCP Server Adapter (v2 - Full Access)
 * Connects Claude Desktop to IRIS via Bridge API.
 * Supports READ and WRITE operations.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Configuración
const BRIDGE_URL = "http://localhost:3000/api/ai/bridge";
const AGENT_KEY = "iris-default-secret-key"; 

// --- DEFINICIÓN DE HERRAMIENTAS ---
const TOOLS = [
  // READ TOOLS
  {
    name: "get_iris_context",
    description: "Recupera el estado completo del sistema: Proyectos, tareas, usuarios.",
    inputSchema: { type: "object", properties: {} },
  },
  
  // WRITE TOOLS - PROJECTS
  {
    name: "update_project",
    description: "Modifica un proyecto existente. Útil para cambiar nombre, estado, prioridad o fecha objetivo.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID del proyecto" },
        updates: { 
            type: "object", 
            description: "Objeto JSON con los campos a cambiar (ej: { project_name: 'Nuevo Nombre', project_status: 'completed' })" 
        }
      },
      required: ["id", "updates"]
    },
  },

  // WRITE TOOLS - TASKS
  {
    name: "update_task",
    description: "Modifica una tarea existente (cambiar estado, asignar usuario, editar título).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID de la tarea (issue_id)" },
        updates: { type: "object", description: "Campos a cambiar" }
      },
      required: ["id", "updates"]
    },
  },
  {
    name: "create_task",
    description: "Crea una nueva tarea en el sistema.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        team_id: { type: "string" }, 
        creator_id: { type: "string" },
        status_id: { type: "string", description: "Opcional. UUID del estado inicial." },
        priority_id: { type: "string", description: "Opcional." },
        description: { type: "string", description: "Opcional." }
      },
      required: ["title", "team_id", "creator_id"]
    },
  },
  {
    name: "delete_task",
    description: "Elimina permanentemente una tarea.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID de la tarea a borrar" }
      },
      required: ["id"]
    },
  }
];

// Inicializar Servidor
const server = new Server(
  { name: "iris-core-link", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    
    // 1. Manejar Lectura (GET)
    if (name === "get_iris_context") {
        const response = await fetch(BRIDGE_URL, { headers: { 'Authorization': `Bearer ${AGENT_KEY}` } });
        const data = await response.json();
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    // 2. Manejar Escritura (POST)
    // Mapeamos la herramienta local a una llamada API genérica
    const payload = {
        tool: name,
        params: name === 'create_task' ? args : // create_task pasa todos los args directo
                (name === 'delete_task' ? { id: args.id } : // delete solo pasa id
                { id: args.id, updates: args.updates }) // update pasa id + objeto updates
    };

    const response = await fetch(BRIDGE_URL, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${AGENT_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || result.error) {
        return { 
            content: [{ type: "text", text: `Error: ${result.error || response.statusText}` }], 
            isError: true 
        };
    }

    return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };

  } catch (error) {
    return {
      content: [{ type: "text", text: `Error Crítico en MCP: ${error.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
