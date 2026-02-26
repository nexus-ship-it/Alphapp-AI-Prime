import { FileNode } from '../types';

// Helper to build a nested file tree from a flat list of files.
export const buildFileTree = (files: {path: string, content: string}[]): FileNode => {
    const root: FileNode = {};
    if (!files) return root;

    files.forEach(file => {
        const parts = file.path.split('/').filter(p => p);
        let currentLevel: FileNode = root;
        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                currentLevel[part] = file.content;
            } else {
                if (!currentLevel[part] || typeof currentLevel[part] !== 'object') {
                    currentLevel[part] = {};
                }
                currentLevel = currentLevel[part] as FileNode;
            }
        });
    });
    return root;
};

// Helper to flatten a nested file tree back into a flat list.
export const flattenFileTree = (node: FileNode, path: string = ''): {path: string, content: string}[] => {
    let files: {path: string, content: string}[] = [];
    for (const name in node) {
        const newPath = path ? `${path}/${name}` : name;
        const content = node[name];
        if (typeof content === 'string') {
            files.push({ path: newPath, content: content });
        } else if (typeof content === 'object' && content !== null) {
            files = files.concat(flattenFileTree(content, newPath));
        }
    }
    return files;
};

// Helper to add a file to an existing FileNode tree. Returns a new tree.
export const addFileToTree = (tree: FileNode, path: string, content: string): FileNode => {
    // Deep copy to avoid mutation of the original state object
    const newTree = JSON.parse(JSON.stringify(tree));
    const parts = path.split('/').filter(p => p);
    let currentLevel: any = newTree;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
            // Last part is the file
            currentLevel[part] = content;
        } else {
            // This part is a directory
            if (!currentLevel[part] || typeof currentLevel[part] !== 'object') {
                currentLevel[part] = {};
            }
            currentLevel = currentLevel[part];
        }
    }
    return newTree;
};

// List of directories to ignore during upload
const IGNORED_DIRS = ['node_modules', '.git', '.next', 'dist', 'build', '.DS_Store'];

// Helper to read files from a FileList (from folder upload)
export const readFilesFromUpload = async (fileList: FileList): Promise<{ path: string, content: string }[]> => {
    const files: { path: string, content: string }[] = [];
    const readPromises: Promise<void>[] = [];

    for (const file of Array.from(fileList)) {
        const path = (file as any).webkitRelativePath || file.name;
        
        // Skip ignored directories and files
        if (IGNORED_DIRS.some(dir => path.includes(`/${dir}/`) || path.startsWith(`${dir}/`))) {
            continue;
        }

        if (file.size > 2 * 1024 * 1024) { // Reduced limit to 2MB for stability
             console.warn(`Skipping large file: ${file.name}`);
             continue;
        }

        // Expanded allowed extensions for better coverage
        const isReadable = file.type.startsWith('text/') || 
                           file.type === 'application/json' || 
                           file.type === 'application/javascript' ||
                           file.type === 'application/typescript' ||
                           file.name.match(/\.(tsx|ts|js|jsx|py|html|css|json|md|yml|yaml|dockerfile|toml|sh|proto)$/i);

        if (!isReadable) {
            continue;
        }

        const promise = new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;
                if (typeof content === 'string') {
                    files.push({ path, content });
                }
                resolve();
            };
            reader.onerror = () => {
                console.error(`Error reading file ${file.name}`);
                resolve();
            };
            reader.readAsText(file);
        });
        readPromises.push(promise);
    }

    await Promise.all(readPromises);
    return files;
};
