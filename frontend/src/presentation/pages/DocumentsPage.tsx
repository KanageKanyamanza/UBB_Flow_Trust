import React from 'react'
import { FileText, Download, Trash2, ExternalLink, Search, LayoutGrid, List, UploadCloud, Share2, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Modal } from '@/presentation/components/ui/modal'
import { useGetDocumentsQuery, useDeleteDocumentMutation, useAddVersionMutation, useUploadDocumentMutation, useGetDocumentLogsQuery } from '@/infrastructure/api/documentApi'
import { BASE_URL } from '@/infrastructure/api/apiSlice'
import { CreateConsentGrantModal } from '@/presentation/components/compliance/CreateConsentGrantModal'
import { useGetConsentGrantsQuery, useRevokeConsentGrantMutation } from '@/infrastructure/api/consentGrantApi'
import { useAuth } from '@/application/context/AuthContext'
import { Seo } from '@/presentation/components/seo/Seo'

export default function DocumentsPage() {
  const { user } = useAuth()
  const isOwner = user?.role === 'OWNER'

  const [isDownloading, setIsDownloading] = React.useState(false)

  const handleDownloadBankPack = async () => {
    setIsDownloading(true)
    try {
      let token = localStorage.getItem('accessToken') || localStorage.getItem('partnerToken')
      if (token && token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1)
      }
      
      const response = await fetch(`${BASE_URL}/export/bank-pack`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Échec du téléchargement du dossier bancaire')
      }
      
      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'Dossier_Bancaire.zip'
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/g.exec(contentDisposition)
        if (matches && matches[1]) {
          filename = decodeURIComponent(matches[1])
        }
      }
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la génération du dossier')
    } finally {
      setIsDownloading(false)
    }
  }

  const { data: documents, isLoading, error: documentsError } = useGetDocumentsQuery(undefined, {
    skip: !isOwner
  })
  const [deleteDocument] = useDeleteDocumentMutation()
  const [addVersion] = useAddVersionMutation()
  const [uploadDocument] = useUploadDocumentMutation()

  const [searchTerm, setSearchTerm] = React.useState('')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [selectedType, setSelectedType] = React.useState('')

  // New States and API Hooks for Access Sharing
  const [activeTab, setActiveTab] = React.useState<'dataroom' | 'shares' | 'logs'>('dataroom')
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false)
  const { data: shares, isLoading: isSharesLoading, error: sharesError } = useGetConsentGrantsQuery(undefined, {
    skip: !isOwner
  })
  const [revokeShare] = useRevokeConsentGrantMutation()
  const { data: logs, isLoading: isLogsLoading, error: logsError } = useGetDocumentLogsQuery(undefined, {
    skip: activeTab !== 'logs' || !isOwner
  })

  // Only owners can access this page
  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] md:h-screen text-center px-4 space-y-6 animate-fade-in">
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
          <ShieldAlert className="w-16 h-16 text-yellow-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">Accès Restreint</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Seul le propriétaire principal de l'organisation peut accéder aux documents de la Data Room.
          </p>
        </div>
      </div>
    )
  }

  const handleRevokeShare = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir révoquer cet accès ? Le partenaire ne pourra plus accéder à vos données.')) {
      try {
        await revokeShare(id).unwrap()
        alert('Accès révoqué avec succès')
      } catch (err: any) {
        alert(err?.data?.error || 'Erreur lors de la révocation')
      }
    }
  }

  const renderSharesTab = () => {
    if (isSharesLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trust"></div>
        </div>
      )
    }

    if (sharesError) {
      return (
        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm text-center">
          <p className="font-bold">Erreur de chargement des partages</p>
          <p className="text-xs mt-1">{(sharesError as any)?.data?.error || 'Impossible de récupérer les partages actifs'}</p>
        </div>
      )
    }

    const hasShares = shares && shares.length > 0

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/5 border border-white/10 p-6 rounded-2xl gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Partages actifs ({shares?.length || 0})</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Ces autorisations permettent à vos partenaires de consulter vos données financières et documentaires. Vous pouvez révoquer ces accès à tout moment.
            </p>
          </div>
          <Button 
            variant="trust" 
            className="gap-2 shadow-lg shadow-trust/20 shrink-0"
            onClick={() => setIsShareModalOpen(true)}
          >
            <Share2 size={16} />
            Autoriser un Partenaire
          </Button>
        </div>

        {!hasShares ? (
          <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl bg-white/2">
            <div className="p-6 bg-white/5 rounded-full w-fit mx-auto mb-6">
              <Share2 className="w-12 h-12 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-xl font-bold mb-2">Aucun accès partagé</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
              Vous n'avez pas encore configuré d'accès tiers. Générez un token sécurisé pour vos banquiers ou auditeurs.
            </p>
            <Button variant="trust" size="lg" className="rounded-full px-8" onClick={() => setIsShareModalOpen(true)}>
              Générer mon premier accès
            </Button>
          </div>
        ) : (
          <div className="glass border-white/10 rounded-xl overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/2 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <th className="px-6 py-4">Partenaire</th>
                    <th className="px-6 py-4">But de l'accès</th>
                    <th className="px-6 py-4">Périmètre</th>
                    <th className="px-6 py-4">Créé le</th>
                    <th className="px-6 py-4">Expiration</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {shares.map((share) => {
                    const isExpired = new Date(share.expiresAt).getTime() <= Date.now()
                    return (
                      <tr key={share.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 font-bold text-sm">{share.partnerName}</td>
                        <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">{share.purpose}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            share.scope === '*' 
                              ? 'bg-trust/10 text-trust border border-trust/20' 
                              : 'bg-white/10 text-white/85 border border-white/10'
                          }`}>
                            {share.scope === '*' ? 'Accès Complet' : 'Vue Profil'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {new Date(share.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className={`text-xs font-semibold ${isExpired ? 'text-destructive' : 'text-green-500'}`}>
                              {isExpired ? 'Expiré' : 'Actif'}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(share.expiresAt).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeShare(share.id)}
                            className="text-destructive hover:bg-destructive/10 h-8 font-black uppercase tracking-widest text-[9px] border border-destructive/10"
                          >
                            Révoquer
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-white/5">
              {shares.map((share) => {
                const isExpired = new Date(share.expiresAt).getTime() <= Date.now()
                return (
                  <div key={share.id} className="p-6 space-y-4 hover:bg-white/2 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base">{share.partnerName}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{share.purpose}</p>
                      </div>
                      <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        share.scope === '*' 
                          ? 'bg-trust/10 text-trust border border-trust/20' 
                          : 'bg-white/10 text-white/85 border border-white/10'
                      }`}>
                        {share.scope === '*' ? 'Accès Complet' : 'Vue Profil'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-muted-foreground text-[10px] uppercase font-black tracking-wider">Créé le</span>
                        <span className="font-semibold text-white/90">{new Date(share.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground text-[10px] uppercase font-black tracking-wider">Expiration</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-destructive' : 'bg-green-500'}`} />
                          <span className={`font-semibold ${isExpired ? 'text-destructive' : 'text-green-500'}`}>
                            {new Date(share.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => handleRevokeShare(share.id)}
                      className="w-full text-destructive hover:bg-destructive/10 border border-destructive/10 text-[10px] uppercase tracking-widest font-black h-9"
                    >
                      Révoquer l'accès
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderLogsTab = () => {
    if (isLogsLoading) {
      return (
        <div className="flex items-center justify-center py-20 animate-fade-in">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-trust"></div>
        </div>
      )
    }

    if (logsError) {
      return (
        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm text-center animate-fade-in">
          <p className="font-bold">Erreur de chargement de l'historique d'accès</p>
          <p className="text-xs mt-1">{(logsError as any)?.data?.error || 'Impossible de récupérer l\'historique d\'accès'}</p>
        </div>
      )
    }

    const getActionLabel = (action: string) => {
      switch (action) {
        case 'PARTNER_DOWNLOAD_DOCUMENT': return 'Téléchargement'
        case 'PARTNER_LIST_DOCUMENTS': return 'Data Room'
        case 'PARTNER_VIEW_PROFILE': return 'Profil & UBOs'
        case 'PARTNER_VIEW_TRANSACTIONS': return 'Transactions'
        case 'PARTNER_VIEW_TRUST_SCORE': return 'Trust Score'
        case 'PARTNER_VIEW_ACCOUNTS': return 'Comptes'
        default: return action
      }
    }

    const getActionStyle = (action: string) => {
      switch (action) {
        case 'PARTNER_DOWNLOAD_DOCUMENT':
          return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        case 'PARTNER_LIST_DOCUMENTS':
          return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        case 'PARTNER_VIEW_PROFILE':
          return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
        case 'PARTNER_VIEW_TRANSACTIONS':
          return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        case 'PARTNER_VIEW_TRUST_SCORE':
          return 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
        case 'PARTNER_VIEW_ACCOUNTS':
          return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
        default:
          return 'bg-white/10 text-white/80 border border-white/10'
      }
    }

    const getResourceLabel = (action: string, data: any) => {
      switch (action) {
        case 'PARTNER_DOWNLOAD_DOCUMENT':
          return data.documentName || data.fileName || 'Document'
        case 'PARTNER_LIST_DOCUMENTS':
          return `Tous les documents (${data.count || 0})`
        case 'PARTNER_VIEW_PROFILE':
          return 'Données de l\'entreprise (Profil & UBOs)'
        case 'PARTNER_VIEW_TRANSACTIONS':
          return `Historique des transactions (${data.count || 0} lignes)`
        case 'PARTNER_VIEW_TRUST_SCORE':
          return `Score de confiance (Score : ${data.score || 0})`
        case 'PARTNER_VIEW_ACCOUNTS':
          return `Comptes bancaires (${data.count || 0} comptes)`
        default:
          return 'Données de l\'organisation'
      }
    }

    const hasLogs = logs && logs.length > 0

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/5 border border-white/10 p-6 rounded-2xl gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Historique de consultation ({logs?.length || 0})</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Suivi et traçabilité des consultations et téléchargements de vos documents par des tiers (banquiers, auditeurs, partenaires).
            </p>
          </div>
        </div>

        {!hasLogs ? (
          <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl bg-white/2">
            <div className="p-6 bg-white/5 rounded-full w-fit mx-auto mb-6">
              <FileText className="w-12 h-12 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-xl font-bold mb-2">Aucune consultation pour le moment</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Vos documents partagés n'ont pas encore été consultés par vos partenaires.
            </p>
          </div>
        ) : (
          <div className="glass border-white/10 rounded-xl overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/2 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <th className="px-6 py-4">Date & Heure</th>
                    <th className="px-6 py-4">Partenaire</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Données consultées / Fichier</th>
                    <th className="px-6 py-4">Motif / But</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log: any) => {
                    const data = log.newData || {}
                    const isDownload = log.action === 'PARTNER_DOWNLOAD_DOCUMENT'
                    return (
                      <tr key={log.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 font-bold text-sm text-white">
                          {data.partnerName || 'Partenaire inconnu'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${getActionStyle(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white/90 font-medium">
                          {isDownload ? (
                            <span className="flex items-center gap-1.5">
                              <FileText size={14} className="text-muted-foreground" />
                              {getResourceLabel(log.action, data)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              {getResourceLabel(log.action, data)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                          {data.purpose || 'Non spécifié'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-white/5">
              {logs.map((log: any) => {
                const data = log.newData || {}
                return (
                  <div key={log.id} className="p-6 space-y-3 hover:bg-white/2 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{data.partnerName || 'Partenaire inconnu'}</h4>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                          {new Date(log.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getActionStyle(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="block text-muted-foreground text-[10px] uppercase font-black tracking-wider">Données consultées</span>
                        <span className="font-semibold text-white/90">
                          {getResourceLabel(log.action, data)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground text-[10px] uppercase font-black tracking-wider">But de l'accès</span>
                        <span className="text-muted-foreground">{data.purpose || 'Non spécifié'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  const ALL_DOC_TYPES = [
    'STATUTS', 'RCCM', 'NUI', 'ETATS_FINANCIERS', 'QUITANCE_IMPOTS', 'BAIL', 'CONTRAT_TRAVAIL', 'AUTRE'
  ]
  const existingTypes = documents?.map(d => d.type) || []
  const missingTypes = ALL_DOC_TYPES.filter(t => !existingTypes.includes(t) || t === 'AUTRE')

  // The backend returns relative URLs like /uploads/filename
  // We need to point to the backend URL for access
  const API_URL = BASE_URL

  const filteredDocs = documents?.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] md:h-screen w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trust"></div>
      </div>
    )
  }

  if (documentsError) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm text-center max-w-6xl mx-auto mt-6">
        <p className="font-bold">Erreur de chargement des documents</p>
        <p className="text-xs mt-1">{(documentsError as any)?.data?.error || 'Impossible de charger les documents'}</p>
      </div>
    )
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.')) {
      try {
        await deleteDocument(id).unwrap()
      } catch (err: any) {
        alert(err?.data?.error || 'Erreur lors de la suppression')
      }
    }
  }

  const handleUpdate = async (id: string, file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)
      await addVersion({ id, formData }).unwrap()
      alert('Version mise à jour avec succès')
    } catch (err: any) {
      alert(err?.data?.error || 'Erreur lors de la mise à jour')
    }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setSelectedType(missingTypes[0] || 'AUTRE')
    setIsModalOpen(true)
  }

  const confirmUpload = async () => {
    if (!selectedFile || !selectedType) return
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('type', selectedType)
      formData.append('name', selectedFile.name)
      await uploadDocument(formData).unwrap()
      alert('Document ajouté avec succès')
      setIsModalOpen(false)
      setSelectedFile(null)
    } catch (err: any) {
      alert(err?.data?.error || "Erreur lors de l'ajout")
    }
  }

  const getFullUrl = (url: string) => {
    if (!url) return '#'
    if (url.startsWith('http')) return url
    return `${API_URL}${url}`
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <Seo title="Data Room — Documents — Trust Lane" noindex />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Room</h1>
          <p className="text-muted-foreground">Votre coffre-fort numérique pour les audits et financements</p>
        </div>
        {activeTab === 'dataroom' && (
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto animate-fade-in mt-2 md:mt-0">
            <div className="flex items-center gap-1 border border-white/10 rounded-lg p-1 bg-white/5">
              <Button 
                variant={viewMode === 'grid' ? 'trust' : 'ghost'} 
                size="icon" 
                className="h-8 w-8 rounded-md" 
                onClick={() => setViewMode('grid')}
                title="Vue Grille"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'trust' : 'ghost'} 
                size="icon" 
                className="h-8 w-8 rounded-md" 
                onClick={() => setViewMode('list')}
                title="Vue Liste"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative flex-1 min-w-[140px] md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un doc..." 
                className="pl-9 bg-white/5 border-white/10 h-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                title="Ajouter un document"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
                }}
              />
              <Button variant="trust" className="gap-2 shadow-lg shadow-trust/20 pointer-events-none">
                Ajouter
              </Button>
            </div>
            <Button
              onClick={handleDownloadBankPack}
              disabled={isDownloading}
              variant="outline"
              className="gap-2 border-trust/50 text-trust hover:bg-trust/10 h-10 shrink-0"
            >
              <Download size={16} className={isDownloading ? 'animate-bounce' : ''} />
              {isDownloading ? 'Génération...' : 'Dossier Bancaire'}
            </Button>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="flex border-b border-white/10 gap-6 overflow-x-auto whitespace-nowrap scrollbar-none pb-px">
        <button
          onClick={() => setActiveTab('dataroom')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'dataroom' ? 'text-trust' : 'text-muted-foreground hover:text-white'
          }`}
        >
          Coffre-fort Documentaire
          {activeTab === 'dataroom' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-trust rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('shares')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'shares' ? 'text-trust' : 'text-muted-foreground hover:text-white'
          }`}
        >
          Partages & Accès Tiers
          {activeTab === 'shares' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-trust rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'logs' ? 'text-trust' : 'text-muted-foreground hover:text-white'
          }`}
        >
          Historique d'accès
          {activeTab === 'logs' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-trust rounded-full" />
          )}
        </button>
      </div>

      {activeTab === 'dataroom' ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredDocs?.map((doc: any) => (
                <Card key={doc.id} className="glass border-white/10 hover:border-trust/30 transition-all group relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-trust/20 rounded-xl text-trust group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <CardTitle className="text-lg truncate font-bold tracking-tight">{doc.name}</CardTitle>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="relative">
                          <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            title="Mettre à jour"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleUpdate(doc.id, e.target.files[0])
                            }}
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-trust/10 text-trust hover:bg-trust hover:text-white transition-colors">
                            <UploadCloud size={14} />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm relative z-20" asChild title="Ouvrir">
                          <a href={getFullUrl(doc.versions[0]?.fileUrl)} target="_blank" rel="noreferrer">
                            <ExternalLink size={14} />
                          </a>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors" 
                          onClick={() => handleDelete(doc.id)}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="text-[10px] uppercase font-black tracking-[0.2em] text-trust mt-1">
                      {doc.type.replace(/_/g, ' ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-4">
                       <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground bg-white/5 p-2 rounded-lg border border-white/5">
                         <span>Mise à jour : {new Date(doc.updatedAt).toLocaleDateString()}</span>
                         <span>{((doc.versions[0]?.fileSize || 0) / 1024 / 1024).toFixed(2)} Mo</span>
                       </div>
                       <Button variant="outline" className="w-full gap-2 text-xs font-bold h-10 border-white/10 bg-white/5 hover:bg-trust/10 transition-colors" asChild>
                         <a href={getFullUrl(doc.versions[0]?.fileUrl)} download={doc.versions[0]?.fileName}>
                           <Download size={14} />
                           Télécharger la version
                         </a>
                       </Button>
                     </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in">
              {filteredDocs?.map((doc: any) => (
                <div key={doc.id} className="glass border-white/10 hover:border-trust/30 transition-all p-4 rounded-xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-trust/20 rounded-lg text-trust">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{doc.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="text-trust uppercase font-black text-[9px] tracking-wider">{doc.type.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{((doc.versions[0]?.fileSize || 0) / 1024 / 1024).toFixed(2)} Mo</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        title="Mettre à jour"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleUpdate(doc.id, e.target.files[0])
                        }}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-trust/10 text-trust">
                        <UploadCloud size={14} />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full relative z-20" asChild title="Ouvrir">
                      <a href={getFullUrl(doc.versions[0]?.fileUrl)} target="_blank" rel="noreferrer">
                        <ExternalLink size={14} />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild title="Télécharger">
                      <a href={getFullUrl(doc.versions[0]?.fileUrl)} download={doc.versions[0]?.fileName}>
                        <Download size={14} />
                      </a>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10" 
                      onClick={() => handleDelete(doc.id)}
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(!filteredDocs || filteredDocs.length === 0) && (
            <div className="text-center py-24 border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/2">
               <div className="p-6 bg-white/5 rounded-full w-fit mx-auto mb-6">
                  <FileText className="w-12 h-12 text-muted-foreground opacity-20" />
               </div>
               <h3 className="text-xl font-bold mb-2">Votre coffre-fort est vide</h3>
               <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                 Uploadez vos documents juridiques et financiers pour constituer votre Data Room et rassurer vos partenaires.
               </p>
               <Button variant="trust" size="lg" className="rounded-full px-8" asChild>
                 <a href="/compliance">Uploader mes premiers documents</a>
               </Button>
            </div>
          )}

          <Modal isOpen={isModalOpen} onClose={() => {
            setIsModalOpen(false)
            setSelectedFile(null)
          }} title="Ajouter un document">
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                <div className="p-2 bg-trust/20 rounded-lg text-trust">
                  <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{selectedFile?.name}</p>
                  <p className="text-xs text-muted-foreground">Fichier sélectionné</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Type de document</label>
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-trust outline-none"
                >
                  {missingTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <Button onClick={confirmUpload} variant="trust" className="w-full h-12 text-base font-bold">
                Uploader le document
              </Button>
            </div>
          </Modal>
        </>
      ) : activeTab === 'shares' ? (
        <div className="animate-fade-in">
          {renderSharesTab()}
        </div>
      ) : (
        <div className="animate-fade-in">
          {renderLogsTab()}
        </div>
      )}

      <CreateConsentGrantModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
    </div>
  )
}
