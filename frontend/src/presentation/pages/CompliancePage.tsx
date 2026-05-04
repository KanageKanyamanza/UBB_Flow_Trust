import React from 'react'
import { ShieldCheck, FileCheck, AlertCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { useGetTrustScoreQuery, useRefreshTrustScoreMutation } from '@/infrastructure/api/trustApi'
import { useGetDocumentsQuery, useUploadDocumentMutation } from '@/infrastructure/api/documentApi'

export default function CompliancePage() {
  const { data: trustData, isLoading: trustLoading } = useGetTrustScoreQuery()
  const { data: documents, isLoading: docsLoading } = useGetDocumentsQuery()
  const [refreshScore, { isLoading: isRefreshing }] = useRefreshTrustScoreMutation()
  const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation()

  if (trustLoading || docsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trust"></div>
      </div>
    )
  }

  const score = trustData?.score || 0
  const reasons = trustData?.reasonCodes || []

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-trust'
    if (s >= 50) return 'text-yellow-500'
    return 'text-destructive'
  }

  const getDocStatus = (type: string) => {
    const doc = documents?.find((d: any) => d.type.toUpperCase() === type.toUpperCase())
    return doc ? 'PASS' : 'MISSING'
  }


  const handleUpload = async (type: string, file: File | undefined) => {
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    formData.append('name', type) // Default name to type for now

    try {
      await uploadDocument(formData).unwrap()
      alert('Document uploadé avec succès')
    } catch (err: any) {
      alert(`Erreur: ${err.data?.error || 'Échec de l\'upload'}`)
    }
  }

  const requiredDocs = [
    { type: 'STATUTS', label: 'Statuts de l\'entreprise' },
    { type: 'RCCM', label: 'Registre du Commerce (RCCM)' },
    { type: 'NUI', label: 'Numéro d\'Identifiant Unique (NUI)' },
    { type: 'ID_GERANT', label: 'Pièce d\'identité du Gérant' },
  ]

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
        <Card className="md:col-span-1 glass border-white/10 flex flex-col justify-center items-center p-8 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-trust/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative mb-4">
            <div className="w-40 h-40 rounded-full border-8 border-white/5 flex items-center justify-center bg-white/2">
              <span className={`text-5xl font-black ${getScoreColor(score)}`}>{score}</span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-xl">
              <ShieldCheck className="w-12 h-12 text-trust" />
            </div>
          </div>
          <h2 className="text-xl font-bold">Trust Score</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">
            Votre score de crédibilité actuel basé sur vos données déclarées et vérifiées.
          </p>
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
            {reasons.length === 0 && (
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
            Checklist de Crédibilité
          </CardTitle>
          <CardDescription>Documents essentiels requis pour la plupart des lignes de crédit</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
            {requiredDocs.map(doc => {
              const status = getDocStatus(doc.type)
              return (
                <div key={doc.type} className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${status === 'PASS' ? 'bg-trust/20 text-trust' : 'bg-destructive/20 text-destructive'}`}>
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="font-bold text-sm block group-hover:text-trust transition-colors">{doc.label}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{doc.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {status === 'MISSING' && (
                      <div className="flex items-center gap-2">
                        <input 
                          type="file" 
                          id={`upload-${doc.type}`} 
                          className="hidden" 
                          onChange={(e) => handleUpload(doc.type, e.target.files?.[0])}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={isUploading}
                          onClick={() => document.getElementById(`upload-${doc.type}`)?.click()}
                          className="h-8 text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10"
                        >
                          {isUploading ? '...' : 'Uploader'}
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${status === 'PASS' ? 'bg-trust/10 text-trust' : 'bg-destructive/10 text-destructive'}`}>
                          {status === 'PASS' ? 'VALIDE' : 'MANQUANT'}
                      </span>
                      {status === 'PASS' ? (
                          <CheckCircle2 className="w-6 h-6 text-trust" />
                      ) : (
                          <XCircle className="w-6 h-6 text-destructive" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
