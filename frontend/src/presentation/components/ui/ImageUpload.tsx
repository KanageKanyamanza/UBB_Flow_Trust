import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/utils';
import { Button } from './button';

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
  value?: string | File | null;
  className?: string;
  label?: string;
  description?: string;
  error?: string;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onFileSelect,
  value,
  className,
  label = "Image Upload",
  description = "Drag & drop your image here, or click to select",
  error,
  accept = { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
  maxSize = 10 * 1024 * 1024, // 10MB
}) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    if (typeof value === 'string') {
      setPreview(value);
    } else if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [value]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      onFileSelect(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onFileSelect(null);
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && <label className="text-sm font-semibold text-foreground/90 ml-1 mb-2 block">{label}</label>}
      
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer transition-all duration-300 rounded-2xl border-2 border-dashed overflow-hidden min-h-[220px] flex flex-col items-center justify-center p-8",
          isDragActive ? "border-primary bg-primary/5 scale-[0.98] shadow-2xl shadow-primary/20" : "border-border/60 hover:border-primary/40 hover:bg-muted/30 hover:shadow-xl",
          isDragReject && "border-destructive bg-destructive/5",
          preview && "border-solid border-primary/10 bg-muted/10",
          error && "border-destructive/50 bg-destructive/5"
        )}
      >
        <input {...getInputProps({ capture: 'environment' })} />

        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className={cn(
                "p-5 rounded-2xl transition-all duration-500",
                isDragActive ? "bg-primary text-white rotate-12 scale-110 shadow-lg" : "bg-primary/10 text-primary group-hover:scale-105 group-hover:-rotate-3"
              )}>
                <Upload size={36} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-lg text-foreground tracking-tight">{description}</p>
                <p className="text-sm text-muted-foreground font-medium">
                  Supports JPG, PNG, WEBP (Max 5MB)
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full h-full flex flex-col items-center justify-center relative min-h-[180px]"
            >
              <div className="relative w-full max-w-[400px] aspect-video rounded-xl overflow-hidden glass shadow-2xl border border-white/10 group/preview">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                   <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    className="gap-2 font-bold backdrop-blur-xl border-white/20"
                  >
                    <Upload size={16} />
                    Changer l'image
                  </Button>
                </div>

                <div className="absolute top-2 right-2">
                   <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={clearSelection}
                    className="h-8 w-8 rounded-full shadow-2xl z-10 hover:scale-110 transition-transform"
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full glass border-white/10 backdrop-blur-xl text-xs font-bold text-white shadow-xl">
                  <div className="w-2 h-2 rounded-full bg-flow animate-pulse shadow-[0_0_8px_rgba(var(--flow-primary),0.8)]" />
                  Image sélectionnée
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-destructive text-sm font-medium px-1"
        >
          <AlertCircle size={14} />
          {error}
        </motion.div>
      )}
    </div>
  );
};
