

import React, { useState } from 'react';
import { FileNode } from '../types';
import { FileIcon, FolderIcon, ChevronRightIcon } from './ui/icons';

interface DirectoryTreeProps {
    structure: FileNode;
    onFileSelect: (path: string, content: string) => void;
    selectedFile: string | null;
}

const TreeNode: React.FC<{
    name: string;
    content: string | FileNode;
    path: string;
    onFileSelect: (path: string, content: string) => void;
    selectedFile: string | null;
// FIX: Changed `memo` to `React.memo` for robustness and to fix potential import issues.
}> = React.memo(({ name, content, path, onFileSelect, selectedFile }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (typeof content === 'string') {
        const isSelected = selectedFile === path;
        return (
            <div
                onClick={() => onFileSelect(path, content)}
                className={`flex items-center space-x-2 py-1.5 px-2 cursor-pointer rounded-md ${isSelected ? 'bg-primary/20 text-white' : 'hover:bg-border/50'}`}
            >
                <FileIcon className="w-5 h-5 text-text-secondary flex-shrink-0" />
                <span className="text-sm truncate">{name}</span>
            </div>
        );
    }

    return (
        <div>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 py-1.5 px-2 cursor-pointer hover:bg-border/50 rounded-md"
            >
                <ChevronRightIcon className={`w-5 h-5 text-text-tertiary transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                <FolderIcon className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">{name}</span>
            </div>
            {isOpen && (
                <div className="pl-5 border-l border-border/70">
                    {Object.entries(content).map(([childName, childContent]) => (
                        <TreeNode
                            key={childName}
                            name={childName}
                            content={childContent}
                            path={`${path}/${childName}`}
                            onFileSelect={onFileSelect}
                            selectedFile={selectedFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

const DirectoryTree: React.FC<DirectoryTreeProps> = ({ structure, onFileSelect, selectedFile }) => {
    return (
        <div className="font-mono text-text-primary">
            {Object.entries(structure).map(([name, content]) => (
                <TreeNode
                    key={name}
                    name={name}
                    content={content}
                    path={name}
                    onFileSelect={onFileSelect}
                    selectedFile={selectedFile}
                />
            ))}
        </div>
    );
};

export default DirectoryTree;