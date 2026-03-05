import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { ChatMessage, FileNode, TechStack, AnalysisIssue } from '../types';
import * as geminiService from '../services/geminiService';
import { useToastContext } from './ToastContext';
import { Chat } from '@google/genai';
import { useProjectContext } from './ProjectContext';
import { buildFileTree, addFileToTree, flattenFileTree } from '../services/fileUtils';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

type ArchitectStep = 'blueprint' | 'clarification' | 'preview' | 'delivery';
export type ProposedFix = { issue: AnalysisIssue; originalContent: string; fixedContent: string };
type GeneratedTest = { path: string; content: string };

interface ArchitectContextType {
    // State
    architectStep: ArchitectStep;
    projectDescription: string;
    techStack: TechStack | null;
    clarificationHistory: ChatMessage[];
    fileStructure: FileNode | null;
    analysisReport: AnalysisIssue[] | null;
    lastGeneratedTest: GeneratedTest | null;
    isLoading: boolean;
    loadingText: string;
    error: string | null;
    fixingIssueId: string | null;

    // Functions
    submitBlueprint: (description: string, techStack: TechStack) => Promise<void>;
    sendClarificationMessage: (userResponse: string, onConversationEnd: (history: ChatMessage[]) => void) => Promise<void>;
    generateArchitecture: (finalHistory: ChatMessage[]) => Promise<void>;
    requestModification: (request: string) => Promise<void>;
    generateTestForFile: (filePath: string, fileContent: string) => Promise<void>;
    clearLastGeneratedTest: () => void;
    runCodeReview: () => Promise<void>;
    runSovereignAudit: () => Promise<void>;
    generateIaC: () => Promise<void>;
    generateFullDocs: () => Promise<void>;
    generateFix: (issue: AnalysisIssue) => Promise<ProposedFix | undefined>;
    applyFix: (fix: ProposedFix) => void;
    loadSampleProject: () => Promise<void>;
    sendToDoctor: () => void;
    sendToDeployer: () => void;
    setStep: (step: ArchitectStep) => void;
    resetArchitect: () => void;
}

const ArchitectContext = createContext<ArchitectContextType | undefined>(undefined);

export const ArchitectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [architectStep, setArchitectStep] = useState<ArchitectStep>('blueprint');
    const [projectDescription, setProjectDescription] = useState('');
    const [techStack, setTechStack] = useState<TechStack | null>(null);
    const [clarificationHistory, setClarificationHistory] = useState<ChatMessage[]>([]);
    const [fileStructure, setFileStructure] = useState<FileNode | null>(null);
    const [analysisReport, setAnalysisReport] = useState<AnalysisIssue[] | null>(null);
    const [lastGeneratedTest, setLastGeneratedTest] = useState<GeneratedTest | null>(null);
    const [clarificationChat, setClarificationChat] = useState<Chat | null>(null);
    const [allQuestions, setAllQuestions] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToastContext();
    const { loadProject } = useProjectContext();

    const [fixingIssueId, setFixingIssueId] = useState<string | null>(null);

    const submitBlueprint = async (description: string, selectedTechStack: TechStack) => {
        setIsLoading(true);
        setLoadingText('Analizando tu idea y preparando preguntas...');
        setError(null);
        setProjectDescription(description);
        setTechStack(selectedTechStack);

        try {
            const questions = await geminiService.generateClarificationQuestions(description, selectedTechStack);

            if (questions.length === 0) {
                addToast({ type: 'info', title: 'Suficiente Información', message: 'Tu descripción es clara. Generando arquitectura directamente.' });
                await generateArchitecture([]);
                return;
            }

            const chatSession = geminiService.startClarificationChat(description);
            setClarificationChat(chatSession);

            setAllQuestions(questions);
            setCurrentQuestionIndex(0);

            const initialHistory: ChatMessage[] = [
                { id: generateId(), sender: 'ai', text: `¡Entendido! Para diseñar la mejor arquitectura para tu proyecto, tengo algunas preguntas.` },
                { id: generateId(), sender: 'ai', text: questions[0] }
            ];
            
            setClarificationHistory(initialHistory);
            setArchitectStep('clarification');
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'No se pudieron generar las preguntas.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error de IA', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    const sendClarificationMessage = async (userResponse: string, onConversationEnd: (h: ChatMessage[]) => void) => {
        if (!clarificationChat) return;

        setIsLoading(true);
        const newUserMessage: ChatMessage = { id: generateId(), sender: 'user', text: userResponse };
        let updatedHistory = [...clarificationHistory, newUserMessage];
        setClarificationHistory(updatedHistory);
        
        try {
            // Send user's answer to AI for context, but we don't need to parse the AI's response here, as we control the question flow.
            await clarificationChat.sendMessage({ message: userResponse });
            
            const nextQuestionIndex = currentQuestionIndex + 1;
            
            if (nextQuestionIndex < allQuestions.length) {
                const nextQuestion = allQuestions[nextQuestionIndex];
                const aiMessage: ChatMessage = { id: generateId(), sender: 'ai', text: nextQuestion };
                updatedHistory = [...updatedHistory, aiMessage];
                setClarificationHistory(updatedHistory);
                setCurrentQuestionIndex(nextQuestionIndex);
            } else {
                const finalMessage: ChatMessage = { id: generateId(), sender: 'ai', text: "¡Perfecto, gracias! Tengo toda la información que necesito." };
                updatedHistory = [...updatedHistory, finalMessage];
                setClarificationHistory(updatedHistory);
                // Trigger the final architecture generation
                setTimeout(() => onConversationEnd(updatedHistory), 1500);
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Error de IA durante la clarificación.';
            addToast({ type: 'error', title: 'Error de Conversación', message: errorMessage });
            const errorAiMessage: ChatMessage = { id: generateId(), sender: 'ai', text: "Lo siento, hubo un problema. Procederé con la información que tengo." };
            setClarificationHistory(prev => [...prev, errorAiMessage]);
            setTimeout(() => onConversationEnd([...clarificationHistory, newUserMessage]), 1500);
        } finally {
            setIsLoading(false);
        }
    };

    const generateArchitecture = async (finalHistory: ChatMessage[]) => {
        if (!projectDescription || !techStack) {
            setError("Falta la descripción del proyecto o el stack tecnológico.");
            return;
        }

        setClarificationHistory(finalHistory);
        setArchitectStep('preview'); // Move immediately to preview to show loader over that screen
        setIsLoading(true);
        setLoadingText('Diseñando la arquitectura del proyecto...');
        setError(null);
        
        try {
            const files = await geminiService.generateProjectArchitecture(projectDescription, techStack, finalHistory);
            const fileTree = buildFileTree(files);
            setFileStructure(fileTree);
            setArchitectStep('preview');
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'No se pudo generar la arquitectura.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error de IA', message: errorMessage });
            setArchitectStep('clarification'); // Go back to let user retry
        } finally {
            setIsLoading(false);
        }
    };

    const requestModification = async (request: string) => {
        if (!fileStructure || !techStack) return;
        setIsLoading(true);
        setLoadingText('Aplicando tus cambios en la arquitectura...');
        setError(null);
        
        try {
            const flatFileTree = flattenFileTree(fileStructure);
            const newFiles = await geminiService.modifyProjectArchitecture(flatFileTree, techStack, request);
            const newFileTree = buildFileTree(newFiles);
            setFileStructure(newFileTree);
            addToast({ type: 'success', title: '¡Arquitectura Actualizada!', message: 'Se han aplicado tus cambios.' });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'No se pudo modificar la arquitectura.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error de IA', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const generateTestForFile = async (filePath: string, fileContent: string) => {
        if (!fileStructure || !techStack) return;
        
        setIsLoading(true);
        setLoadingText(`Generando pruebas para ${filePath}...`);
        setError(null);

        try {
            const testFile = await geminiService.generateUnitTest(filePath, fileContent, techStack);
            const newFileTree = addFileToTree(fileStructure, testFile.path, testFile.content);
            setFileStructure(newFileTree);
            setLastGeneratedTest(testFile);
            addToast({ type: 'success', title: 'Prueba Generada', message: `Se creó ${testFile.path} exitosamente.` });
        } catch (e) {
             const errorMessage = e instanceof Error ? e.message : 'No se pudo generar el archivo de prueba.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error al Generar Prueba', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    const clearLastGeneratedTest = () => {
        setLastGeneratedTest(null);
    };

    const runCodeReview = async () => {
        if (!fileStructure || !techStack) return;
        setIsLoading(true);
        setLoadingText('Analizando el código en busca de problemas...');
        setError(null);
        setAnalysisReport(null);

        try {
            const flatFiles = flattenFileTree(fileStructure);
            const analysisResult = await geminiService.generateFullCodeAnalysis(flatFiles, techStack);

            const report: AnalysisIssue[] = [
                ...analysisResult.security.map((i): AnalysisIssue => ({ ...i, category: 'Seguridad' })),
                ...analysisResult.dependencies.map((i): AnalysisIssue => ({ ...i, category: 'Análisis de Dependencias' })),
                ...analysisResult.quality.map((i): AnalysisIssue => ({ ...i, category: 'Calidad' })),
                ...analysisResult.best_practices.map((i): AnalysisIssue => ({ ...i, category: 'Mejores Prácticas' })),
                ...analysisResult.dependency_optimization.map((i): AnalysisIssue => ({ ...i, category: 'Optimización de Dependencias' })),
            ];
            
            setAnalysisReport(report);
            addToast({ type: 'success', title: 'Análisis Completado', message: `Se encontraron ${report.length} problemas en total.` });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'No se pudo completar el análisis de código.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error de Análisis', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const runSovereignAudit = async () => {
        if (!fileStructure || !techStack) return;
        setIsLoading(true);
        setLoadingText('Iniciando Auditoría Soberana (Nivel Omni)...');
        setError(null);

        try {
            const flatFiles = flattenFileTree(fileStructure);
            const auditResult = await geminiService.generateSovereignAudit(flatFiles, techStack);
            
            const report: AnalysisIssue[] = [
                ...(auditResult.seguridad_extrema || []).map((i: any): AnalysisIssue => ({ ...i, category: 'Seguridad' })),
                ...(auditResult.optimizacion_critica || []).map((i: any): AnalysisIssue => ({ ...i, category: 'Calidad' })),
                ...(auditResult.resiliencia_infra || []).map((i: any): AnalysisIssue => ({ ...i, category: 'Mejores Prácticas' })),
            ];
            
            setAnalysisReport(prev => [...(prev || []), ...report]);
            addToast({ type: 'success', title: 'Auditoría Soberana Finalizada', message: 'Se han integrado protocolos de resiliencia extrema.' });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Fallo en la Auditoría Soberana.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error Crítico', message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const generateIaC = async () => {
        if (!projectDescription || !techStack || !fileStructure) return;
        setIsLoading(true);
        setLoadingText('Generando Infraestructura como Código (IaC)...');
        
        try {
            const iacFiles = await geminiService.generateIaCConfig(projectDescription, techStack);
            let newTree = fileStructure;
            for (const file of iacFiles) {
                newTree = addFileToTree(newTree, `infra/${file.path}`, file.content);
            }
            setFileStructure(newTree);
            addToast({ type: 'success', title: 'Infraestructura Lista', message: 'Se han generado manifiestos de K8s y Terraform.' });
        } catch (e) {
            addToast({ type: 'error', title: 'Error IaC', message: 'No se pudo generar la infraestructura.' });
        } finally {
            setIsLoading(false);
        }
    };

    const generateFullDocs = async () => {
        if (!projectDescription || !techStack || !fileStructure) return;
        setIsLoading(true);
        setLoadingText('Redactando Documentación Técnica Omnisciente...');
        
        try {
            const flatFiles = flattenFileTree(fileStructure);
            const docs = await geminiService.generateDocumentation(projectDescription, techStack, flatFiles);
            const newTree = addFileToTree(fileStructure, 'DOCS_SOBERANOS.md', docs);
            setFileStructure(newTree);
            addToast({ type: 'success', title: 'Documentación Generada', message: 'El manual técnico ha sido integrado en el núcleo.' });
        } catch (e) {
            addToast({ type: 'error', title: 'Error Docs', message: 'No se pudo generar la documentación.' });
        } finally {
            setIsLoading(false);
        }
    };

    const generateFix = useCallback(async (issue: AnalysisIssue): Promise<ProposedFix | undefined> => {
        if (!fileStructure) return undefined;
        const issueId = `${issue.filePath}-${issue.line}-${issue.title}`;
        setFixingIssueId(issueId);
        setError(null);
        try {
            const flatFiles = flattenFileTree(fileStructure);
            const fileToFix = flatFiles.find(f => f.path === issue.filePath);
            if (!fileToFix) {
                throw new Error(`No se pudo encontrar el archivo: ${issue.filePath}`);
            }
            const fixedContent = await geminiService.generateCodeFix(fileToFix.path, fileToFix.content, issue);
            return { issue, originalContent: fileToFix.content, fixedContent };
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Error al generar la solución.';
            setError(errorMessage);
            addToast({ type: 'error', title: 'Error de IA', message: errorMessage });
            return undefined;
        } finally {
            setFixingIssueId(null);
        }
    }, [fileStructure, addToast]);

    const applyFix = (fix: ProposedFix) => {
        if (!fileStructure) return;
        
        const { issue, fixedContent } = fix;

        const updatedFiles = flattenFileTree(fileStructure).map(file => 
            file.path === issue.filePath ? { ...file, content: fixedContent } : file
        );
        const newFileTree = buildFileTree(updatedFiles);
        setFileStructure(newFileTree);

        const updatedReport = analysisReport?.map(r => 
            (r.filePath === issue.filePath && r.line === issue.line && r.title === issue.title) 
            ? { ...r, isResolved: true } 
            : r
        ) ?? null;
        setAnalysisReport(updatedReport);
        
        addToast({ type: 'success', title: 'Solución Aplicada', message: `Se actualizó ${issue.filePath}.` });
    };

    const loadSampleProject = async () => {
        setIsLoading(true);
        setLoadingText('Cargando proyecto de ejemplo...');
        setError(null);

        const sampleDescription = "Una simple aplicación de lista de tareas (To-Do) con un frontend en React y un backend en Node.js (Express).";
        const sampleTechStack: TechStack = {
            frontend: 'React',
            backend: 'Node.js',
            database: 'None',
            mobile: 'None',
            devops: [],
        };
        const sampleFiles: { path: string; content: string }[] = [
            // Backend files
            {
                path: 'backend/server.js',
                content: `const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Base de datos en memoria
let todos = [
  { id: 1, text: 'Aprender React', completed: true },
  { id: 2, text: 'Construir un proyecto de ejemplo', completed: false },
  { id: 3, text: 'Desplegar en la nube', completed: false },
];

app.get('/api/todos', (req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  if (!req.body.text) {
    return res.status(400).json({ error: 'El texto es requerido' });
  }
  const newTodo = {
    id: Date.now(),
    text: req.body.text,
    completed: false,
  };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.listen(port, () => {
  console.log(\`Backend de To-Do escuchando en http://localhost:\${port}\`);
});
`
            },
            {
                path: 'backend/package.json',
                content: `{
  "name": "backend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "scripts": {
    "start": "node server.js"
  }
}`
            },
            // Frontend files
            {
                path: 'frontend/src/App.tsx',
                content: `import React, { useState, useEffect } from 'react';
import './index.css';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const API_URL = 'http://localhost:3001/api/todos';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        setError(null);
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('No se pudieron cargar las tareas.');
        }
        const data: Todo[] = await response.json();
        setTodos(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
        setError(message);
        // Fallback to mock data on error for demo purposes
        setTodos([
          { id: 1, text: 'Aprender React (fallback)', completed: true },
          { id: 2, text: 'Construir un proyecto de ejemplo (fallback)', completed: false },
        ]);
      }
    };

    fetchTodos();
  }, []);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      setError(null);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: input }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'No se pudo añadir la tarea.' }));
        throw new Error(errorData.error || 'No se pudo añadir la tarea.');
      }

      const newTodo: Todo = await response.json();
      setTodos([...todos, newTodo]);
      setInput('');
    } catch (err) {
       const message = err instanceof Error ? err.message : 'Ocurrió un error desconocido al añadir la tarea.';
       setError(message);
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteRequest = (todo: Todo) => {
    setTodoToDelete(todo);
  };

  const confirmDelete = () => {
    if (todoToDelete) {
      // In a real app, you would make an API call here.
      // e.g., await fetch(\`\${API_URL}/\${todoToDelete.id}\`, { method: 'DELETE' });
      setTodos(todos.filter(todo => todo.id !== todoToDelete.id));
      setTodoToDelete(null);
    }
  };

  const cancelDelete = () => {
    setTodoToDelete(null);
  };

  return (
    <div className="app-container">
      {todoToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirmar Eliminación</h2>
            <p>¿Estás seguro de que quieres eliminar la tarea "{todoToDelete.text}"?</p>
            <div className="modal-actions">
              <button onClick={cancelDelete} className="btn-cancel">Cancelar</button>
              <button onClick={confirmDelete} className="btn-delete">Borrar</button>
            </div>
          </div>
        </div>
      )}
      <h1>Lista de Tareas</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={addTodo}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Añadir una nueva tarea..."
        />
        <button type="submit">Añadir</button>
      </form>
      <ul>
        {todos.map(todo => (
          <li
            key={todo.id}
            className={todo.completed ? 'completed' : ''}
          >
            <span onClick={() => toggleTodo(todo.id)} className="todo-text">
                {todo.text}
            </span>
            <button onClick={() => handleDeleteRequest(todo)} className="delete-btn" aria-label={\`Eliminar tarea: \${todo.text}\`}>
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;`
            },
            {
                path: 'frontend/src/index.css',
                content: `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #1a1a1a;
  color: #f0f0f0;
  display: flex;
  justify-content: center;
  padding-top: 50px;
}

.app-container {
  width: 100%;
  max-width: 500px;
  background-color: #242424;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  border: 1px solid #333;
}

h1 {
  text-align: center;
  color: #6A0DAD;
}

.error-message {
  background-color: #7f1d1d;
  color: #fecaca;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  border: 1px solid #b91c1c;
}

form {
  display: flex;
  margin-bottom: 1.5rem;
}

input {
  flex-grow: 1;
  padding: 0.75rem;
  border: 1px solid #444;
  background: #1a1a1a;
  color: white;
  border-radius: 4px 0 0 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #6A0DAD;
}

button {
  padding: 0.75rem 1rem;
  border: none;
  background-color: #6A0DAD;
  color: white;
  font-weight: bold;
  cursor: pointer;
  border-radius: 0 4px 4px 0;
  transition: background-color 0.2s;
}

button:hover {
    background-color: #5A0B9D;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 0.75rem;
  background: #2f2f2f;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

li:hover {
  background-color: #3a3f47;
}

li.completed {
    opacity: 0.6;
}

li.completed .todo-text {
    text-decoration: line-through;
}

.todo-text {
    cursor: pointer;
    flex-grow: 1;
    display: flex;
    align-items: center;
}

.todo-text::before {
    content: '';
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    border: 2px solid #6A0DAD;
    flex-shrink: 0;
    margin-right: 0.75rem;
}

li.completed .todo-text::before {
    background-color: #6A0DAD;
}

li::before {
    content: none;
}

.delete-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 0.5rem;
  border-radius: 4px;
  line-height: 1;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}

li:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #ef4444;
  background-color: #ef444420;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background-color: #242424;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  border: 1px solid #333;
  animation: slideUp 0.3s ease;
}

.modal-content h2 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #f0f0f0;
  margin-bottom: 1rem;
}

.modal-content p {
  color: #d1d5db;
  margin-bottom: 2rem;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.modal-actions button {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: #4b5563;
  color: white;
  border: none;
}

.btn-cancel:hover {
  background-color: #6b7280;
}

.btn-delete {
  background-color: #dc2626;
  color: white;
  border: none;
}

.btn-delete:hover {
  background-color: #ef4444;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
`
            },
             {
                path: 'frontend/package.json',
                content: `{
  "name": "frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  }
}`
            },
            // Root files
            {
                path: 'package.json',
                content: `{
  "name": "todo-app-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "start:frontend": "npm start --workspace=frontend",
    "start:backend": "npm start --workspace=backend"
  }
}`
            },
            {
                path: '.gitignore',
                content: `# Dependencies
/node_modules
/.pnp
.pnp.js

# Build files
/dist
/build

# IDE config
.vscode/
.idea/

# Log files
*.log
`
            }
        ];

        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const fileTree = buildFileTree(sampleFiles);

        setProjectDescription(sampleDescription);
        setTechStack(sampleTechStack);
        setFileStructure(fileTree);
        setArchitectStep('preview');
        
        setIsLoading(false);
        addToast({type: 'success', title: '¡Éxito!', message: 'Proyecto de ejemplo cargado.'});
    };
    
    const sendToDoctor = useCallback(() => {
        if (!fileStructure || !techStack || !projectDescription) {
            addToast({ type: 'error', title: 'Error', message: 'No se puede enviar un proyecto incompleto al Doctor.' });
            return;
        }
        const flatFiles = flattenFileTree(fileStructure);
        const projectName = projectDescription.split(' ').slice(0, 5).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
        loadProject(flatFiles, techStack, projectName);
    }, [fileStructure, techStack, projectDescription, loadProject, addToast]);

    const sendToDeployer = useCallback(() => {
        if (!fileStructure || !techStack || !projectDescription) {
            addToast({ type: 'error', title: 'Error', message: 'No se puede enviar un proyecto incompleto al Desplegador.' });
            return;
        }
        const flatFiles = flattenFileTree(fileStructure);
        const projectName = projectDescription.split(' ').slice(0, 5).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
        loadProject(flatFiles, techStack, projectName, null);
    }, [fileStructure, techStack, projectDescription, loadProject, addToast]);


    const resetArchitect = useCallback(() => {
        setArchitectStep('blueprint');
        setProjectDescription('');
        setTechStack(null);
        setClarificationHistory([]);
        setFileStructure(null);
        setClarificationChat(null);
        setAllQuestions([]);
        setCurrentQuestionIndex(0);
        setIsLoading(false);
        setError(null);
        setLoadingText('');
        setAnalysisReport(null);
        setFixingIssueId(null);
        setLastGeneratedTest(null);
    }, []);

    const value: ArchitectContextType = {
        architectStep,
        projectDescription,
        techStack,
        clarificationHistory,
        fileStructure,
        analysisReport,
        lastGeneratedTest,
        isLoading,
        loadingText,
        error,
        fixingIssueId,
        submitBlueprint,
        sendClarificationMessage,
        generateArchitecture,
        requestModification,
        generateTestForFile,
        clearLastGeneratedTest,
        runCodeReview,
        runSovereignAudit,
        generateIaC,
        generateFullDocs,
        setStep: setArchitectStep,
        resetArchitect,
        generateFix,
        applyFix,
        loadSampleProject,
        sendToDoctor,
        sendToDeployer,
    };

    return <ArchitectContext.Provider value={value}>{children}</ArchitectContext.Provider>;
};

export const useArchitectContext = () => {
    const context = useContext(ArchitectContext);
    if (context === undefined) {
        throw new Error('useArchitectContext must be used within an ArchitectProvider');
    }
    return context;
};