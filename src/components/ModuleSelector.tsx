import React from 'react';
import { Module } from '../types';
import { ArrowRight } from 'lucide-react';

interface ModuleSelectorProps {
  modules: Module[];
  selectedModule: Module | null;
  onSelectModule: (module: Module) => void;
}

const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  modules,
  selectedModule,
  onSelectModule,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Select a Module</h2>
      <div className="grid gap-4">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => onSelectModule(module)}
            className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
              selectedModule?.id === module.id
                ? 'border-blue-500 ring-2 ring-blue-100'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${module.color}`}>
                <span className="text-white text-xl">{module.icon}</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900">{module.name}</h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModuleSelector;