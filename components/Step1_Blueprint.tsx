
import React, { useState } from 'react';
import { TechStack, TechCategory, TechOption, TechValue } from '../types';
import { 
    ReactIcon, VueIcon, NodeJsIcon, PythonIcon, PostgreSqlIcon, MongoDbIcon, AngularIcon, SvelteIcon, GoIcon, JavaIcon, MySqlIcon, RedisIcon, ReactNativeIcon, FlutterIcon, SwiftIcon, KotlinIcon, DockerIcon, KubernetesIcon, GitHubActionsIcon, JenkinsIcon 
} from './ui/TechIcons';
import { useArchitectContext } from '../contexts/ArchitectContext';

interface Step1BlueprintProps {
    onSubmit: (description: string, techStack: TechStack) => void;
}

const techOptions: Record<Exclude<TechCategory, 'devops'>, TechOption[]> & { devops: TechOption[] } = {
    frontend: [
        { name: 'React', icon: ReactIcon, description: "Librería de UI declarativa y basada en componentes, ideal para SPAs." },
        { name: 'Vue', icon: VueIcon, description: "Framework progresivo, conocido por su curva de aprendizaje suave y flexibilidad." },
        { name: 'Angular', icon: AngularIcon, description: "Plataforma robusta para construir aplicaciones empresariales complejas." },
        { name: 'Svelte', icon: SvelteIcon, description: "Compilador radical que escribe código para manipular el DOM directamente." },
        { name: 'None', icon: () => <div className="w-10 h-10 flex items-center justify-center text-sm font-semibold">N/A</div>, description: "No se requiere un framework de frontend específico (ej. para una API pura)." },
    ],
    backend: [
        { name: 'Node.js', icon: NodeJsIcon, description: "Entorno de ejecución para JavaScript del lado del servidor, ideal para APIs rápidas." },
        { name: 'Python', icon: PythonIcon, description: "Versátil y potente, excelente para desarrollo web, datos y IA (Django/Flask)." },
        { name: 'Go', icon: GoIcon, description: "Lenguaje compilado de Google, conocido por su concurrencia y alto rendimiento." },
        { name: 'Java', icon: JavaIcon, description: "Robusto y escalable, muy utilizado en sistemas empresariales (Spring)." },
        { name: 'None', icon: () => <div className="w-10 h-10 flex items-center justify-center text-sm font-semibold">N/A</div>, description: "No se requiere un backend específico (ej. para una web estática)." },
    ],
    database: [
        { name: 'PostgreSQL', icon: PostgreSqlIcon, description: "Base de datos relacional de objetos, potente y extensible." },
        { name: 'MongoDB', icon: MongoDbIcon, description: "Base de datos NoSQL orientada a documentos, flexible y escalable." },
        { name: 'MySQL', icon: MySqlIcon, description: "La base de datos relacional de código abierto más popular del mundo." },
        { name: 'Redis', icon: RedisIcon, description: "Almacén en memoria de estructura de datos, usado como caché o BD." },
        { name: 'None', icon: () => <div className="w-10 h-10 flex items-center justify-center text-sm font-semibold">N/A</div>, description: "No se requiere una base de datos." },
    ],
    mobile: [
        { name: 'React Native', icon: ReactNativeIcon, description: "Construye apps nativas para iOS y Android usando React." },
        { name: 'Flutter', icon: FlutterIcon, description: "Kit de herramientas de UI de Google para apps compiladas nativamente." },
        { name: 'Swift', icon: SwiftIcon, description: "Lenguaje de programación potente e intuitivo para apps de Apple (iOS, macOS)." },
        { name: 'Kotlin', icon: KotlinIcon, description: "Lenguaje moderno y preferido por Google para el desarrollo de apps Android." },
        { name: 'None', icon: () => <div className="w-10 h-10 flex items-center justify-center text-sm font-semibold">N/A</div>, description: "No se requiere desarrollo móvil." },
    ],
    devops: [
        { name: 'Docker', icon: DockerIcon, description: "Plataforma para desarrollar, enviar y ejecutar aplicaciones en contenedores." },
        { name: 'Kubernetes', icon: KubernetesIcon, description: "Sistema de orquestación de contenedores para automatizar el despliegue." },
        { name: 'GitHub Actions', icon: GitHubActionsIcon, description: "Automatiza flujos de trabajo de CI/CD directamente desde GitHub." },
        { name: 'Jenkins', icon: JenkinsIcon, description: "Servidor de automatización de código abierto para construir, probar y desplegar." },
    ]
};

const TechSelectionGroup: React.FC<{
    title: string;
    options: TechOption[];
    selection: TechValue | TechValue[];
    onSelect: (value: TechValue) => void;
    selectionType: 'single' | 'multiple';
}> = React.memo(({ title, options, onSelect, selection, selectionType }) => (
    <div>
        <h3 className="text-xl font-bold text-accent mb-4 text-center">{title}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {options.map((option) => {
                const isSelected = selectionType === 'single' ? selection === option.name : (selection as TechValue[]).includes(option.name);
                return (
                    <div key={option.name} className="relative group">
                        <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary to-highlight rounded-xl blur opacity-0 ${isSelected ? 'opacity-75' : 'group-hover:opacity-50'} transition duration-500`}></div>
                        <button
                            type="button" onClick={() => onSelect(option.name)}
                            title={option.description}
                            aria-pressed={isSelected}
                            className={`relative p-4 w-full h-full rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 aspect-square transform hover:-translate-y-1
                                ${isSelected ? 'bg-primary/30 border-primary shadow-glow-primary' : 'bg-surface/80 border-border hover:border-highlight'}`}>
                            <option.icon className={`w-10 h-10 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className={`font-semibold text-center text-sm ${isSelected ? 'text-white' : 'text-text-secondary'}`}>{option.name}</span>
                        </button>
                    </div>
                );
            })}
        </div>
    </div>
));


const Step1Blueprint: React.FC<Step1BlueprintProps> = ({ onSubmit }) => {
    const { loadSampleProject } = useArchitectContext();
    const [features, setFeatures] = useState<string[]>([]);
    const [currentFeature, setCurrentFeature] = useState('');
    const [techStack, setTechStack] = useState<TechStack>({
        frontend: 'React',
        backend: 'Node.js',
        database: 'MongoDB',
        mobile: 'None',
        devops: ['Docker', 'GitHub Actions'],
    });

    const handleTechSelect = (category: TechCategory, value: TechValue) => {
        setTechStack(prev => {
            if (category === 'devops') {
                const currentDevops = prev.devops;
                if (currentDevops.includes(value)) {
                    return { ...prev, devops: currentDevops.filter(v => v !== value) };
                } else {
                    return { ...prev, devops: [...currentDevops, value] };
                }
            }
            return { ...prev, [category]: value };
        });
    };

    const handleAddFeature = () => {
        if (currentFeature.trim()) {
            setFeatures(prev => [...prev, currentFeature.trim()]);
            setCurrentFeature('');
        }
    };

    const handleRemoveFeature = (indexToRemove: number) => {
        setFeatures(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (features.length > 0) {
            const fullDescription = `La aplicación debe tener las siguientes características:\n- ${features.join('\n- ')}`;
            onSubmit(fullDescription, techStack);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-primary mb-2 drop-shadow-text-glow-primary">
                Paso 1: Define tu Prototipo
            </h1>
            <p className="text-lg text-text-secondary mb-4">
                Selecciona tu stack tecnológico y luego describe tu idea. Seré más preciso con más detalles.
            </p>
             <div className="mb-10">
                <button 
                    type="button" 
                    onClick={loadSampleProject}
                    className="text-primary hover:text-primary-focus font-semibold transition-colors duration-200 underline"
                >
                    ¿No tienes una idea? Carga un proyecto de ejemplo.
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-12">
                
                <section className="bg-surface/30 border border-border/50 p-6 rounded-2xl backdrop-blur-sm">
                    <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">Stack Principal (Web/Backend)</h2>
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-left">
                        <TechSelectionGroup title="Frontend" options={techOptions.frontend} selection={techStack.frontend} onSelect={(v) => handleTechSelect('frontend', v)} selectionType="single" />
                        <TechSelectionGroup title="Backend" options={techOptions.backend} selection={techStack.backend} onSelect={(v) => handleTechSelect('backend', v)} selectionType="single" />
                        <TechSelectionGroup title="Base de Datos" options={techOptions.database} selection={techStack.database} onSelect={(v) => handleTechSelect('database', v)} selectionType="single" />
                    </div>
                </section>

                <section className="bg-surface/30 border border-border/50 p-6 rounded-2xl backdrop-blur-sm">
                    <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">Plataforma Móvil (Opcional)</h2>
                    <TechSelectionGroup title="" options={techOptions.mobile} selection={techStack.mobile} onSelect={(v) => handleTechSelect('mobile', v)} selectionType="single" />
                </section>
                
                 <section className="bg-surface/30 border border-border/50 p-6 rounded-2xl backdrop-blur-sm">
                    <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">DevOps y CI/CD (Opcional)</h2>
                    <TechSelectionGroup title="" options={techOptions.devops} selection={techStack.devops} onSelect={(v) => handleTechSelect('devops', v)} selectionType="multiple" />
                </section>


                <div>
                    <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">Describe tu Proyecto</h2>
                    <div className="w-full max-w-4xl mx-auto bg-surface/80 border-2 border-border/50 rounded-lg backdrop-blur-sm shadow-inner">
                        <div className="p-4 min-h-[120px]">
                            {features.length === 0 ? (
                                <p className="text-text-tertiary text-center py-8">Añade las características principales de tu proyecto.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {features.map((feature, index) => (
                                        <li key={index} className="flex items-center justify-between bg-background/50 p-3 rounded-md animate-fade-in group">
                                            <span className="text-text-primary">{feature}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveFeature(index)}
                                                className="w-6 h-6 flex items-center justify-center bg-transparent text-text-secondary rounded-full opacity-50 group-hover:opacity-100 group-hover:bg-error/20 group-hover:text-error transition-all"
                                                aria-label={`Eliminar característica: ${feature}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="p-3 border-t border-border/50 flex gap-2">
                            <input
                                value={currentFeature}
                                onChange={(e) => setCurrentFeature(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddFeature();
                                    }
                                }}
                                placeholder="Ej: Autenticación de usuarios con JWT"
                                className="w-full p-2 bg-surface border border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            />
                            <button 
                                type="button" 
                                onClick={handleAddFeature}
                                className="px-5 py-2 bg-accent text-accent-content font-semibold rounded-lg hover:bg-accent-focus transition-colors"
                            >
                                Añadir
                            </button>
                        </div>
                    </div>
                </div>
                
                <button
                    type="submit"
                    disabled={features.length === 0}
                    className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-primary to-accent hover:from-primary-focus hover:to-accent-focus text-primary-content font-bold text-xl rounded-lg transition-all transform hover:scale-105 duration-300 shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Iniciar Diseño
                </button>
            </form>
        </div>
    );
};

export default Step1Blueprint;