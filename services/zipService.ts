

import JSZip from 'jszip';
import { FileNode } from '../types';

const addFilesToZip = (zip: JSZip, structure: FileNode, path: string) => {
    for (const name in structure) {
        const fullPath = path ? `${path}/${name}` : name;
        const content = structure[name];
        if (typeof content === 'string') {
            zip.file(fullPath, content);
        } else if (typeof content === 'object' && content !== null) {
            addFilesToZip(zip, content as FileNode, fullPath);
        }
    }
};

export const createProjectZip = async (structure: FileNode, projectName: string = 'code-architect-project', fontFiles: FileList | null = null): Promise<Blob> => {
    const zip = new JSZip();
    
    addFilesToZip(zip, structure, '');

    // Add font files if they exist
    if (fontFiles) {
        for (let i = 0; i < fontFiles.length; i++) {
            const file = fontFiles[i];
            // Use webkitRelativePath to maintain the folder structure from user's selection
            // and place it inside a /public/fonts directory in the zip.
            // Cast to any to access the non-standard webkitRelativePath property.
            const filePathInZip = `public/fonts/${(file as any).webkitRelativePath || file.name}`;
            zip.file(filePathInZip, file);
        }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    return blob;
};

export const downloadZip = (blob: Blob, projectName: string = 'code-architect-project') => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};