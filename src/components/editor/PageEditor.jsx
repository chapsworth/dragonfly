import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Settings, Plus, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ComponentLibraryPicker from './ComponentLibraryPicker';
import { cn } from '@/lib/utils';

export default function PageEditor({ sections, onSectionsChange, children }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [insertIndex, setInsertIndex] = useState(null);

  const handleAddSection = (index) => {
    setInsertIndex(index);
    setShowPicker(true);
  };

  const handleInsertTemplate = (templateCode) => {
    const newSections = [...sections];
    newSections.splice(insertIndex, 0, {
      id: Date.now().toString(),
      code: templateCode,
      type: 'template'
    });
    onSectionsChange(newSections);
    setShowPicker(false);
    setInsertIndex(null);
  };

  const handleDeleteSection = (index) => {
    const newSections = sections.filter((_, i) => i !== index);
    onSectionsChange(newSections);
  };

  const handleMoveSection = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    onSectionsChange(newSections);
  };

  const handleAddSpacing = (index) => {
    const newSections = [...sections];
    newSections.splice(index, 0, {
      id: Date.now().toString(),
      code: '<div className="py-8"></div>',
      type: 'spacing'
    });
    onSectionsChange(newSections);
  };

  return (
    <div className="relative">
      {/* Edit Mode Toggle */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setIsEditMode(!isEditMode)}
        className={cn(
          "fixed top-24 right-4 z-50 p-3 rounded-full shadow-lg transition-all",
          isEditMode 
            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" 
            : "bg-white text-slate-700 hover:bg-slate-50"
        )}
      >
        <Settings className="w-5 h-5" />
      </motion.button>

      {/* Content with Edit Controls */}
      <div className="relative">
        <AnimatePresence>
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-24 right-20 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-64"
            >
              <h3 className="font-semibold text-slate-900 mb-3">Page Editor</h3>
              <p className="text-xs text-slate-600 mb-3">Click + to add sections, use arrows to reorder, or trash to delete.</p>
              <Button
                size="sm"
                onClick={() => setIsEditMode(false)}
                variant="outline"
                className="w-full"
              >
                Exit Edit Mode
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add button at top */}
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center py-2"
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddSection(0)}
              className="border-dashed border-2 border-blue-400 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Section
            </Button>
          </motion.div>
        )}

        {/* Render all sections (children + dynamic sections) */}
        {[...React.Children.toArray(children), ...sections].map((item, index) => {
          const isTemplate = item?.type === 'template' || item?.type === 'spacing';
          const totalSections = React.Children.count(children) + sections.length;
          
          return (
            <div key={item?.id || index} className="relative">
              {isEditMode && (
                <div className="absolute -left-16 top-4 flex flex-col gap-2 z-40">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleMoveSection(index, 'up')}
                    disabled={index === 0}
                    className="w-8 h-8"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="w-8 h-8 cursor-move"
                  >
                    <GripVertical className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleMoveSection(index, 'down')}
                    disabled={index === totalSections - 1}
                    className="w-8 h-8"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleDeleteSection(index)}
                    className="w-8 h-8 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className={cn(
                "relative transition-all",
                isEditMode && "border-2 border-dashed border-blue-300 rounded-lg"
              )}>
                {isTemplate ? (
                  <div dangerouslySetInnerHTML={{ __html: item.code }} />
                ) : (
                  item
                )}
              </div>

              {isEditMode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center gap-2 py-2"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddSection(index + 1)}
                    className="border-dashed border-2 border-blue-400 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add from Library
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddSpacing(index + 1)}
                    className="border-dashed border-2 border-slate-300 text-slate-600 hover:bg-slate-50"
                  >
                    Add Spacing
                  </Button>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Component Library Picker */}
      <ComponentLibraryPicker
        isOpen={showPicker}
        onClose={() => {
          setShowPicker(false);
          setInsertIndex(null);
        }}
        onSelect={handleInsertTemplate}
      />
    </div>
  );
}