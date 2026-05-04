import React from 'react'
import { FileText, Download, Trash2, ExternalLink, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { useGetDocumentsQuery, useDeleteDocumentMutation } from '@/infrastructure/api/documentApi'

export default function DocumentsPage() {
  const { data: documents, isLoading } = useGetDocumentsQuery()
  const [deleteDocument] = useDeleteDocumentMutation()
  const [searchTerm, setSearchTerm] = React.useState('')

  // The backend returns relative URLs like /uploads/filename
  // We need to point to the backend URL for access
  const API_URL = 'http://localhost:5000'

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
      } catch (err) {
        alert('Erreur lors de la suppression')
      }
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
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un doc..." 
              className="pl-9 bg-white/5 border-white/10 h-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="trust" className="gap-2 shadow-lg shadow-trust/20" asChild>
            <a href="/compliance">
              Ajouter
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs?.map((doc: any) => (
          <Card key={doc.id} className="glass border-white/10 hover:border-trust/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-trust opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-trust/20 rounded-xl text-trust group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm" asChild title="Ouvrir">
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
              <CardTitle className="text-lg mt-4 truncate font-bold tracking-tight">{doc.name}</CardTitle>
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
        
        {(!filteredDocs || filteredDocs.length === 0) && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/2">
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
      </div>
    </div>
  )
}
