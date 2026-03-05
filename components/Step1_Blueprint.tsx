
import React, { useState } from 'react';
import { TechStack, TechCategory, TechOption, TechValue } from '../types';
import { 
    ReactIcon, VueIcon, NodeJsIcon, PythonIcon, PostgreSqlIcon, MongoDbIcon, AngularIcon, SvelteIcon, GoIcon, JavaIcon, MySqlIcon, RedisIcon, ReactNativeIcon, FlutterIcon, SwiftIcon, KotlinIcon, DockerIcon, KubernetesIcon, GitHubActionsIcon, JenkinsIcon 
} from './ui/TechIcons';
import { useArchitectContext } from '../contexts/ArchitectContext';
import { 
    PackageIcon, 
    CodeIcon, 
    MessageSquareIcon 
} from './ui/icons';

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
        <div className="w-full max-w-7xl mx-auto text-center animate-fade-in pb-20">
            <div className="relative mb-12">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10"></div>
                <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-primary/50 mb-4 tracking-tighter uppercase drop-shadow-text-glow-primary">
                    Arquitecto de Código
                </h1>
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase mb-4">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Protocolo de Diseño Soberano
                </div>
                <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                    Define el ADN de tu sistema. Selecciona el stack tecnológico y describe las funciones núcleo.
                </p>
            </div>

            <div className="mb-12 flex justify-center">
                <button 
                    type="button" 
                    onClick={loadSampleProject}
                    className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-surface/40 border border-border/50 text-text-secondary hover:text-primary hover:border-primary/50 transition-all duration-300 backdrop-blur-sm"
                >
                    <PackageIcon className="w-5 h-5 group-hover:animate-bounce" />
                    <span className="font-bold text-sm uppercase tracking-tighter">¿Sin ideas? Carga un Proyecto de Referencia</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
                <div className="grid grid-cols-1 gap-8">
                    <section className="relative overflow-hidden bg-surface/20 border border-border/50 p-8 rounded-3xl backdrop-blur-md group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CodeIcon className="w-32 h-32" />
                        </div>
                        <h2 className="text-2xl font-black text-text-primary mb-10 text-left uppercase tracking-tighter flex items-center gap-3">
                            <div className="w-8 h-1 bg-primary"></div>
                            Stack Principal y Persistencia
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-left">
                            <TechSelectionGroup title="Frontend" options={techOptions.frontend} selection={techStack.frontend} onSelect={(v) => handleTechSelect('frontend', v)} selectionType="single" />
                            <TechSelectionGroup title="Backend" options={techOptions.backend} selection={techStack.backend} onSelect={(v) => handleTechSelect('backend', v)} selectionType="single" />
                            <TechSelectionGroup title="Base de Datos" options={techOptions.database} selection={techStack.database} onSelect={(v) => handleTechSelect('database', v)} selectionType="single" />
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-surface/20 border border-border/50 p-8 rounded-3xl backdrop-blur-md">
                            <h2 className="text-xl font-black text-text-primary mb-8 text-left uppercase tracking-tighter flex items-center gap-3">
                                <div className="w-6 h-1 bg-accent"></div>
                                Ecosistema Móvil
                            </h2>
                            <TechSelectionGroup title="" options={techOptions.mobile} selection={techStack.mobile} onSelect={(v) => handleTechSelect('mobile', v)} selectionType="single" />
                        </section>
                        
                        <section className="bg-surface/20 border border-border/50 p-8 rounded-3xl backdrop-blur-md">
                            <h2 className="text-xl font-black text-text-primary mb-8 text-left uppercase tracking-tighter flex items-center gap-3">
                                <div className="w-6 h-1 bg-highlight"></div>
                                Infraestructura y CI/CD
                            </h2>
                            <TechSelectionGroup title="" options={techOptions.devops} selection={techStack.devops} onSelect={(v) => handleTechSelect('devops', v)} selectionType="multiple" />
                        </section>
                    </div>
                </div>

                <section className="bg-surface/30 border border-border/50 p-8 rounded-3xl backdrop-blur-md relative overflow-hidden">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl"></div>
                    <h2 className="text-2xl font-black text-text-primary mb-8 text-left uppercase tracking-tighter flex items-center gap-3">
                        <div className="w-8 h-1 bg-primary"></div>
                        Especificaciones del Sistema
                    </h2>
                    
                    <div className="w-full max-w-5xl mx-auto bg-black/40 border border-border/50 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 min-h-[160px] max-h-[400px] overflow-y-auto custom-scrollbar">
                            {features.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
                                    <MessageSquareIcon className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-lg font-medium italic">El manifiesto está vacío. Añade las funciones clave de tu arquitectura.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex items-center justify-between bg-surface/50 border border-border/30 p-4 rounded-xl animate-slide-up group hover:border-primary/50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-primary shadow-glow-primary"></div>
                                                <span className="text-text-primary font-medium">{feature}</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveFeature(index)}
                                                className="p-1.5 rounded-lg text-text-tertiary hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100"
                                                aria-label={`Eliminar característica: ${feature}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-surface/30 border-t border-border/50 flex gap-3">
                            <input
                                value={currentFeature}
                                onChange={(e) => setCurrentFeature(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddFeature();
                                    }
                                }}
                                placeholder="Ej: Implementar Microservicios con comunicación gRPC..."
                                className="flex-grow p-3 bg-black/50 border border-border/50 rounded-xl text-text-primary placeholder:text-text-tertiary focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            />
                            <button 
                                type="button" 
                                onClick={handleAddFeature}
                                className="px-8 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary-focus transition-all shadow-glow-primary uppercase tracking-tighter text-sm"
                            >
                                Añadir
                            </button>
                        </div>
                    </div>
                </section>
                
                <div className="pt-8">
                    <button
                        type="submit"
                        disabled={features.length === 0}
                        className="group relative inline-flex items-center justify-center px-16 py-5 font-black text-white transition-all duration-300 bg-primary rounded-2xl hover:bg-primary-focus shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none overflow-hidden"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <span className="relative flex items-center gap-3 text-xl uppercase tracking-widest">
                            Sintetizar Arquitectura
                            <CodeIcon className="w-6 h-6" />
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Step1Blueprint;