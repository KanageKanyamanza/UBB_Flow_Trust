import React, { useState } from 'react'
import { ShieldCheck, FileCheck, AlertCircle, RefreshCw, CheckCircle2, XCircle, Clock, ChevronLeft, User, FileText, Camera, MapPin, UploadCloud, ArrowRight, ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { useGetTrustScoreQuery, useRefreshTrustScoreMutation } from '@/infrastructure/api/trustApi'
import { useGetDocumentsQuery, useUploadDocumentMutation } from '@/infrastructure/api/documentApi'
import { useGetComplianceQuery, useStartComplianceMutation, useGetGapQuery } from '@/infrastructure/api/complianceApi'
import { cn } from '@/shared/utils/utils'
import { useAuth } from '@/application/context/AuthContext'

const STEPS = [
  { id: "personal", title: "Informations", icon: User, description: "Vos données" },
  { id: "document", title: "Identité", icon: FileText, description: "Passeport/CNI" },
  { id: "selfie", title: "Selfie", icon: Camera, description: "Vérification" },
  { id: "address", title: "Domicile", icon: MapPin, description: "Justificatif" },
];

export default function CompliancePage() {
  const { user } = useAuth()
  const { data: trustData, isLoading: trustLoading } = useGetTrustScoreQuery()
  const { data: documents, isLoading: docsLoading } = useGetDocumentsQuery()
  const { data: complianceData, isLoading: complianceLoading } = useGetComplianceQuery()
  const { data: gapData } = useGetGapQuery({ market: 'LOCAL' })
  const [refreshScore, { isLoading: isRefreshing }] = useRefreshTrustScoreMutation()
  const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation()
  const [startCompliance, { isLoading: isStarting }] = useStartComplianceMutation()

  // Only owners can access this page
  if (user?.role !== 'OWNER') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-6 animate-fade-in">
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
          <ShieldAlert className="w-16 h-16 text-yellow-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">Accès Restreint</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Seul le propriétaire principal de l'organisation peut configurer et gérer le statut de conformité.
          </p>
        </div>
      </div>
    )
  }

  const [isJourneyActive, setIsJourneyActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [journeyCompleted, setJourneyCompleted] = useState(false)

  // Form states for the journey
  const [personalInfo, setPersonalInfo] = useState({ profession: "", sourceOfFunds: "" })
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [addressFile, setAddressFile] = useState<File | null>(null)

  if (trustLoading || docsLoading || complianceLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trust"></div>
      </div>
    )
  }

  const score = trustData?.score || 0
  const reasons = trustData?.reasonCodes || []

  // SVG parameters for animated circular Trust Score badge
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getScoreStrokeColor = (s: number) => {
    if (s >= 80) return 'stroke-trust'
    if (s >= 50) return 'stroke-yellow-500'
    return 'stroke-destructive'
  }

  // Dynamic calculations for score factors of impact (Hausse / Baisse)
  const positiveFactors = []
  const negativeFactors = []

  if (!reasons.includes('PROFIL_MANQUANT') && !reasons.includes('PROFIL_INCOMPLET')) {
    positiveFactors.push({ text: 'Profil complété', pts: '+20 pts' })
  } else {
    negativeFactors.push({ text: 'Profil incomplet/manquant', pts: '-20 pts' })
  }

  if (!reasons.includes('OFFICIERS_MANQUANTS')) {
    positiveFactors.push({ text: 'UBOs déclarés', pts: '+20' })
  } else {
    negativeFactors.push({ text: 'UBOs manquants', pts: '-20' })
  }

  if (!reasons.includes('DOCUMENTS_MANQUANTS')) {
    positiveFactors.push({ text: 'Statuts, RCCM & NUI fournis', pts: '+40' })
  } else {
    negativeFactors.push({ text: 'Pièces administratives manquantes', pts: '-40' })
  }

  if (!reasons.includes('ACTIVITE_FAIBLE') && !reasons.includes('AUCUNE_ACTIVITE')) {
    positiveFactors.push({ text: 'Activité financière active', pts: '+20' })
  } else {
    if (reasons.includes('ACTIVITE_FAIBLE')) {
      negativeFactors.push({ text: 'Activité transactionnelle faible', pts: '-10' })
    } else {
      negativeFactors.push({ text: 'Aucune transaction enregistrée', pts: '-20' })
    }
  }

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-trust'
    if (s >= 50) return 'text-yellow-500'
    return 'text-destructive'
  }

  const STATUS_LABELS: Record<string, string> = {
    MISSING: 'Manquant',
    IN_REVIEW: 'En révision',
    PASS: 'Validé',
    FAIL: 'Rejeté',
    NOT_APPLICABLE: 'Non applicable'
  }

  const requirementToTypeMap: { [key: string]: string } = {
    "Statuts de l'entreprise": "STATUTS",
    "Registre du Commerce (RCCM)": "RCCM",
    "Numéro d'Identifiant Unique (NUI)": "NUI",
    "Attestation de non-redevance fiscale": "ATTESTATION_FISCALE",
    "États financiers (Dernier exercice)": "ETATS_FINANCIERS",
    "Extrait K-bis (ou équivalent)": "KBIS",
    "Numéro de TVA intracommunautaire": "TVA",
    "Document d'évaluation des risques (DUERP)": "DUERP",
    "Politique de protection des données (RGPD)": "RGPD",
    "États financiers certifiés": "ETATS_FINANCIERS_CERTIFIES"
  }

  const handleUpload = async (type: string, file: File | undefined) => {
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    formData.append('name', type)

    try {
      await uploadDocument(formData).unwrap()
      alert('Document uploadé avec succès')
    } catch (err: any) {
      alert(`Erreur: ${err.data?.error || 'Échec de l\'upload'}`)
    }
  }

  const submitJourney = async () => {
    try {
      // In a real app, upload the files here
      if (documentFile) await handleUpload("ID_DOCUMENT", documentFile)
      if (addressFile) await handleUpload("ADDRESS_PROOF", addressFile)
      // Selfie upload etc.
      
      await startCompliance({ market: 'LOCAL' }).unwrap()
      setJourneyCompleted(true)
    } catch (err) {
      alert('Erreur lors de la soumission du dossier')
    }
  }

  const handleNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      submitJourney()
    }
  }

  const isStepValid = () => {
    const step = STEPS[currentStepIndex];
    if (step.id === "personal") return personalInfo.profession && personalInfo.sourceOfFunds;
    if (step.id === "document") return documentFile !== null;
    if (step.id === "selfie") return selfieFile !== null;
    if (step.id === "address") return addressFile !== null;
    return false;
  }

  const renderJourneyStep = () => {
    const step = STEPS[currentStepIndex]
    switch (step.id) {
      case "personal":
        return (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold">Informations Complémentaires</h3>
            <div>
              <label className="block text-sm font-semibold mb-1">Profession / Activité</label>
              <input 
                type="text" 
                value={personalInfo.profession}
                onChange={(e) => setPersonalInfo({...personalInfo, profession: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-trust outline-none"
                placeholder="Ex: Ingénieur, Commerçant..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Origine des fonds</label>
              <select 
                value={personalInfo.sourceOfFunds}
                onChange={(e) => setPersonalInfo({...personalInfo, sourceOfFunds: e.target.value})}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-trust outline-none"
              >
                <option value="">Sélectionnez une origine</option>
                <option value="salary">Salaire / Revenus</option>
                <option value="business">Chiffre d'affaires</option>
                <option value="savings">Épargne</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>
        )
      case "document":
        return (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold">Pièce d'Identité</h3>
            <div className="border-2 border-dashed border-trust/30 rounded-2xl p-6 text-center hover:bg-trust/5 transition-colors relative">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                accept="image/*,.pdf"
              />
              <UploadCloud className="w-8 h-8 text-trust mx-auto mb-2" />
              <p className="font-semibold">{documentFile ? documentFile.name : "Télécharger votre pièce d'identité"}</p>
              <p className="text-xs text-muted-foreground mt-1">Passeport, CNI ou Titre de séjour</p>
            </div>
          </div>
        )
      case "selfie":
        return (
          <div className="space-y-4 animate-fade-in">
             <h3 className="text-lg font-bold">Vérification Faciale</h3>
             <div className="border-2 border-dashed border-trust/30 rounded-2xl p-6 text-center hover:bg-trust/5 transition-colors relative">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                accept="image/*"
                capture="user"
              />
              <Camera className="w-8 h-8 text-trust mx-auto mb-2" />
              <p className="font-semibold">{selfieFile ? selfieFile.name : "Prendre un selfie"}</p>
              <p className="text-xs text-muted-foreground mt-1">Lieu bien éclairé, visage dégagé</p>
            </div>
          </div>
        )
      case "address":
        return (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold">Justificatif de Domicile</h3>
            <div className="border-2 border-dashed border-trust/30 rounded-2xl p-6 text-center hover:bg-trust/5 transition-colors relative">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setAddressFile(e.target.files?.[0] || null)}
                accept="image/*,.pdf"
              />
              <UploadCloud className="w-8 h-8 text-trust mx-auto mb-2" />
              <p className="font-semibold">{addressFile ? addressFile.name : "Télécharger le justificatif"}</p>
              <p className="text-xs text-muted-foreground mt-1">Facture d'eau, d'électricité ou relevé bancaire (- 3 mois)</p>
            </div>
          </div>
        )
      default: return null
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conformité & Trust</h1>
          <p className="text-muted-foreground">Suivez votre éligibilité au financement et votre score de crédibilité</p>
        </div>
        <Button onClick={() => refreshScore()} disabled={isRefreshing} variant="outline" className="gap-2 border-trust/50 text-trust hover:bg-trust/10">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser le score
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 glass border-white/10 flex flex-col items-center p-6 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-trust/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Animated Circular Score Badge */}
          <div className="relative w-40 h-40 mb-4 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-white/5"
                strokeWidth="8"
                fill="transparent"
              />
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                className={cn("transition-all duration-500", getScoreStrokeColor(score))}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <motion.span 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className={cn("text-4xl font-black font-mono", getScoreColor(score))}
              >
                {score}
              </motion.span>
              <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mt-0.5">SCORE</span>
            </div>
            <div className="absolute bottom-1 right-1 bg-background rounded-full p-1 shadow-xl">
              <ShieldCheck className="w-8 h-8 text-trust" />
            </div>
          </div>

          <div className="space-y-4 w-full">
            <div>
              <h2 className="text-lg font-bold">Trust Score</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider mt-0.5">
                Facteurs d'impact
              </p>
            </div>

            {/* Impact factors - Positive & Negative */}
            <div className="space-y-2 text-left w-full border-t border-white/5 pt-4">
              {positiveFactors.map((factor, index) => (
                <div key={index} className="flex justify-between items-center bg-green-500/5 border border-green-500/10 px-3 py-1.5 rounded-xl text-xs">
                  <span className="text-green-400/90 font-medium flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-green-400" />
                    {factor.text}
                  </span>
                  <span className="text-green-400 font-bold font-mono text-[10px]">{factor.pts}</span>
                </div>
              ))}

              {negativeFactors.map((factor, index) => (
                <div key={index} className="flex justify-between items-center bg-destructive/5 border border-destructive/10 px-3 py-1.5 rounded-xl text-xs">
                  <span className="text-destructive/90 font-medium flex items-center gap-1.5">
                    <TrendingDown size={12} className="text-destructive" />
                    {factor.text}
                  </span>
                  <span className="text-destructive font-bold font-mono text-[10px]">{factor.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 glass border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <CheckCircle2 className="w-5 h-5 text-trust" />
               Analyse de Conformité
            </CardTitle>
            <CardDescription>Points d'amélioration identifiés par l'algorithme UBB Trust</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reasons.map((reason: string) => (
              <div key={reason} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm tracking-tight">{reason.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground mt-1">Action requise pour augmenter votre score et rassurer vos partenaires financiers.</p>
                </div>
              </div>
            ))}
            {gapData?.missing.map((req: string) => (
              <div key={req} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <FileText className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm tracking-tight">{req}</p>
                  <p className="text-xs text-muted-foreground mt-1">Document manquant pour le marché LOCAL.</p>
                </div>
              </div>
            ))}
            {reasons.length === 0 && (!gapData || gapData.missing.length === 0) && (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-trust/10 rounded-2xl border border-trust/20 border-dashed">
                <div className="p-4 bg-trust/20 rounded-full text-trust">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <p className="font-bold text-xl text-trust tracking-tight">Profil Exemplaire</p>
                  <p className="text-sm text-trust/80 max-w-sm">Félicitations ! Votre profil est complet et prêt pour un audit par nos partenaires financiers.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-white/10 overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/2">
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-trust" />
            Parcours de Conformité
          </CardTitle>
          <CardDescription>Documents essentiels requis pour valider votre compte</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!complianceData && !isJourneyActive ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="p-4 bg-white/5 rounded-full text-muted-foreground">
                <ShieldCheck size={48} />
              </div>
              <div>
                <p className="font-bold text-xl mb-2">Vérification d'Identité (KYC)</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Afin de sécuriser votre compte et d'accéder à l'ensemble de nos services, nous devons vérifier votre identité.
                </p>
              </div>
              <Button onClick={() => setIsJourneyActive(true)} className="bg-trust hover:bg-trust/80 text-white px-8 mt-4">
                Démarrer le parcours
              </Button>
            </div>
          ) : isJourneyActive && !journeyCompleted ? (
            <div className="p-8 max-w-2xl mx-auto animate-slide-up">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4 relative z-10">
                  {STEPS.map((step, index) => {
                    const StepIcon = step.icon
                    const isActive = index === currentStepIndex
                    const isPast = index < currentStepIndex
                    
                    return (
                      <div key={step.id} className="flex flex-col items-center relative">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300",
                          isActive ? "bg-trust text-white shadow-lg shadow-trust/30 scale-110" :
                          isPast ? "bg-trust/20 text-trust" : "bg-white/5 text-muted-foreground border border-white/10"
                        )}>
                          {isPast ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                        </div>
                        <span className={cn("text-[10px] mt-2 font-bold absolute -bottom-5 w-24 text-center", isActive ? "text-trust" : "text-muted-foreground")}>
                          {step.title}
                        </span>
                      </div>
                    )
                  })}
                  <div className="absolute top-1/2 left-6 right-6 h-1 bg-white/5 -z-10 -translate-y-1/2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-trust transition-all duration-500 ease-out"
                      style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6">
                {renderJourneyStep()}
              </div>

              <div className="mt-8 flex justify-between items-center">
                {currentStepIndex > 0 ? (
                  <Button variant="ghost" onClick={() => setCurrentStepIndex(p => p - 1)}>
                    Retour
                  </Button>
                ) : <div />}
                <Button 
                  onClick={handleNextStep}
                  disabled={!isStepValid() || isStarting}
                  className="bg-trust hover:bg-trust/90 text-white gap-2"
                >
                  {isStarting ? 'Traitement...' : currentStepIndex === STEPS.length - 1 ? 'Soumettre le dossier' : 'Continuer'}
                  {currentStepIndex !== STEPS.length - 1 && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ) : journeyCompleted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-fade-in">
               <div className="p-4 bg-trust/20 rounded-full text-trust">
                 <CheckCircle2 size={48} />
               </div>
               <h2 className="text-2xl font-bold">Dossier Soumis !</h2>
               <p className="text-muted-foreground max-w-md">
                 Vos documents ont été envoyés avec succès. Notre équipe de conformité va les vérifier.
                 Vous serez notifié une fois votre compte validé.
               </p>
               <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                 Retour au tableau de bord
               </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
              {complianceData?.items.map((item: any) => {
                const isPass = item.status === 'PASS'
                const isInReview = item.status === 'IN_REVIEW'
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl transition-colors", isPass ? 'bg-trust/20 text-trust' : isInReview ? 'bg-yellow-500/20 text-yellow-500' : 'bg-destructive/20 text-destructive')}>
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                          <span className="font-bold text-sm block group-hover:text-trust transition-colors">{item.requirement}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{STATUS_LABELS[item.status] || item.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {!isPass && !isInReview && (
                        <div className="flex items-center gap-2">
                          <input 
                            type="file" 
                            id={`upload-${item.id}`} 
                            className="hidden" 
                            onChange={(e) => {
                              const type = requirementToTypeMap[item.requirement] || item.requirement
                              handleUpload(type, e.target.files?.[0])
                            }}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={isUploading}
                            onClick={() => document.getElementById(`upload-${item.id}`)?.click()}
                            className="h-8 text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10"
                          >
                            {isUploading ? '...' : 'Uploader'}
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-black px-3 py-1 rounded-full", isPass ? 'bg-trust/10 text-trust' : isInReview ? 'bg-yellow-500/10 text-yellow-500' : 'bg-destructive/10 text-destructive')}>
                            {STATUS_LABELS[item.status] || item.status}
                        </span>
                        {isPass ? (
                            <CheckCircle2 className="w-6 h-6 text-trust" />
                        ) : isInReview ? (
                            <Clock className="w-6 h-6 text-yellow-500" />
                        ) : (
                            <XCircle className="w-6 h-6 text-destructive" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
