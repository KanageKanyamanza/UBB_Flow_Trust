import React from 'react'
import { FileText, Download, Trash2, ExternalLink, Search, LayoutGrid, List, UploadCloud } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Modal } from '@/presentation/components/ui/modal'
import { useGetDocumentsQuery, useDeleteDocumentMutation, useAddVersionMutation, useUploadDocumentMutation } from '@/infrastructure/api/documentApi'
import { BASE_URL } from '@/infrastructure/api/apiSlice'

export default function DocumentsPage() {
  const { data: documents, isLoading } = useGetDocumentsQuery()
  const [deleteDocument] = useDeleteDocumentMutation()
  const [addVersion] = useAddVersionMutation()
  const [uploadDocument] = useUploadDocumentMutation()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [selectedType, setSelectedType] = React.useState('')

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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trust"></div>
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Room</h1>
          <p className="text-muted-foreground">Votre coffre-fort numérique pour les audits et financements</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
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
          <div className="relative flex-1 md:w-64">
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
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="space-y-3">
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
    </div>
  )
}
