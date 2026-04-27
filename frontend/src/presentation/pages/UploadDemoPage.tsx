import React, { useState } from 'react';
import { ImageUpload } from '../components/ui/ImageUpload';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Send, Wand2, Upload, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const UploadDemoPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setIsSuccess(false);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setIsSuccess(true);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6 md:p-12 animate-fade-in">
      <div className="w-full max-w-2xl space-y-8">
        <header className="flex items-center justify-between w-full">
          <div className="px-3 py-1 bg-trust/10 border border-trust/20 rounded-full text-xs font-bold text-trust flex items-center gap-1.5">
            <Wand2 size={12} />
            Demo Component
          </div>
        </header>

        <section className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Importation <span className="text-trust">Documentaire</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Utilisez notre composant Drag & Drop premium pour vos justificatifs et documents officiels.
          </p>
        </section>

        <Card className="glass border-white/5 overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-trust via-flow to-trust/50 opacity-50" />
          
          <CardHeader>
            <CardTitle>Justificatif de Domicile</CardTitle>
            <CardDescription>Format accepté: PNG, JPG ou WEBP. Maximum 5 MB.</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <ImageUpload 
              onFileSelect={handleFileSelect} 
              value={selectedFile}
              label=""
              description="Glissez votre image ici"
            />

            <div className="flex flex-col gap-4">
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                    <span>Téléchargement en cours...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-trust to-flow-primary glow-trust"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              )}

              {isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-flow-primary/10 border border-flow-primary/20 rounded-xl p-4 flex items-center gap-3 text-flow-primary font-bold shadow-lg"
                >
                  <div className="bg-flow-primary text-white rounded-full p-1">
                    <CheckCircle2 size={16} />
                  </div>
                  Document enregistré avec succès !
                </motion.div>
              )}

              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || isSuccess}
                variant={isSuccess ? "secondary" : "trust"}
                className="w-full h-14 text-lg font-bold shadow-xl transition-all active:scale-[0.98]"
              >
                {isUploading ? (
                  "Traitement en cours..."
                ) : isSuccess ? (
                  <span className="flex items-center gap-2">Terminé <CheckCircle2 size={20} /></span>
                ) : (
                  <span className="flex items-center gap-2">Envoyer le document <Send size={20} /></span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Drag & Drop", icon: <Upload size={14} />, color: "text-trust" },
            { title: "Prévisualisation", icon: <FileText size={14} />, color: "text-flow" },
            { title: "Validation IA", icon: <CheckCircle2 size={14} />, color: "text-gold" }
          ].map((item, i) => (
            <div key={i} className="glass p-3 rounded-lg flex items-center gap-3 border-white/5">
              <div className={`p-2 rounded-md bg-white/5 ${item.color}`}>
                {item.icon}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative Blur Blobs */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-trust/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-flow/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
    </div>
  );
};

export default UploadDemoPage;
