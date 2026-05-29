import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Users, FileText, Save, Plus, Trash2, TrendingUp, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { useGetProfileQuery, useUpdateProfileMutation } from '@/infrastructure/api/profileApi'
import { useAuth } from '@/application/context/AuthContext'

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general')
  const { data: profile, isLoading } = useGetProfileQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  
  const [formData, setFormData] = useState<any>(null)

  useEffect(() => {
    if (profile) {
      setFormData(profile)
    }
  }, [profile])

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
            Seul le propriétaire principal de l'organisation peut configurer et modifier le profil de la PME.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trust"></div>
      </div>
    )
  }

  const handleSave = async () => {
    try {
      await updateProfile(formData).unwrap()
      alert('Profil mis à jour avec succès')
    } catch (err) {
      alert('Erreur lors de la mise à jour')
    }
  }

  const addOfficer = () => {
    setFormData({
      ...formData,
      beneficialOwners: [
        ...(formData.beneficialOwners || []),
        { name: '', role: '', ownershipPct: 0 }
      ]
    })
  }

  const removeOfficer = (index: number) => {
    const newOfficers = [...formData.beneficialOwners]
    newOfficers.splice(index, 1)
    setFormData({ ...formData, beneficialOwners: newOfficers })
  }

  const updateOfficer = (index: number, field: string, value: any) => {
    const newOfficers = [...formData.beneficialOwners]
    newOfficers[index] = { ...newOfficers[index], [field]: value }
    setFormData({ ...formData, beneficialOwners: newOfficers })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profil PME</h1>
          <p className="text-muted-foreground">Gérez l'identité et la structure de votre entreprise pour renforcer votre crédibilité</p>
        </div>
        <Button onClick={handleSave} disabled={isUpdating} variant="trust" className="gap-2 shadow-lg shadow-trust/20">
          <Save className="w-4 h-4" />
          Enregistrer les modifications
        </Button>
      </div>

      <div className="flex overflow-x-auto gap-2 border-b border-white/10 mb-6 scrollbar-hide">
        <button 
          onClick={() => setActiveTab('general')}
          className={`pb-3 px-6 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'general' ? 'border-b-2 border-trust text-trust font-bold' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Building2 className="w-4 h-4" /> Informations Générales
        </button>
        <button 
          onClick={() => setActiveTab('officers')}
          className={`pb-3 px-6 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'officers' ? 'border-b-2 border-trust text-trust font-bold' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Users className="w-4 h-4" /> Dirigeants & Bénéficiaires
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className={`pb-3 px-6 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'docs' ? 'border-b-2 border-trust text-trust font-bold' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <FileText className="w-4 h-4" /> Architecture Documentaire
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-trust" />
                  Identité Légale
                </CardTitle>
                <CardDescription>Informations officielles enregistrées au greffe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nom Légal de l'Entité</label>
                  <Input 
                    placeholder="Ex: Ma PME SARL"
                    value={formData.legalName} 
                    onChange={e => setFormData({...formData, legalName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Numéro de Registre (RCCM)</label>
                    <Input 
                      placeholder="RCCM-..."
                      value={formData.registrationNo || ''} 
                      onChange={e => setFormData({...formData, registrationNo: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Identifiant Fiscal (NUI)</label>
                    <Input 
                      placeholder="M..."
                      value={formData.taxId || ''} 
                      onChange={e => setFormData({...formData, taxId: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Secteur d'activité</label>
                  <Input 
                    placeholder="Ex: Agrobusiness, Tech, Commerce..."
                    value={formData.industry || ''} 
                    onChange={e => setFormData({...formData, industry: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5 text-trust" />
                  Contact & Localisation
                </CardTitle>
                <CardDescription>Où vous trouver et comment vous contacter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Siège Social (Adresse complète)</label>
                  <Input 
                    placeholder="Quartier, Ville, Pays"
                    value={formData.address || ''} 
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email Professionnel</label>
                    <Input 
                      type="email"
                      placeholder="contact@entreprise.com"
                      value={formData.email || ''} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Téléphone</label>
                    <Input 
                      placeholder="+237 ..."
                      value={formData.phone || ''} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Site Web / Réseaux Sociaux</label>
                  <Input 
                    placeholder="https://..."
                    value={formData.website || ''} 
                    onChange={e => setFormData({...formData, website: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'officers' && (
          <Card className="glass border-white/10">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="w-5 h-5 text-trust" />
                  Dirigeants & Bénéficiaires Effectifs
                </CardTitle>
                <CardDescription>Personnes physiques détenant le contrôle ou la direction</CardDescription>
              </div>
              <Button onClick={addOfficer} variant="outline" size="sm" className="gap-2 border-trust/50 text-trust hover:bg-trust/10">
                <Plus className="w-4 h-4" /> Ajouter un membre
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.beneficialOwners && formData.beneficialOwners.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {formData.beneficialOwners.map((bo: any, index: number) => (
                    <div key={index} className="p-5 bg-white/5 border border-white/10 rounded-2xl relative hover:bg-white/10 transition-colors group flex flex-col justify-between">
                      <button 
                        onClick={() => removeOfficer(index)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Header Card */}
                      <div className="flex items-center gap-3 mb-4 pr-6">
                        <div className="w-10 h-10 rounded-full bg-trust/20 flex items-center justify-center text-trust font-black text-xs uppercase shrink-0">
                          {bo.name ? bo.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '??'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">Dirigeant</p>
                          <p className="font-bold text-sm truncate text-white">{bo.name || 'Nouveau membre'}</p>
                        </div>
                        <div className="bg-trust/10 text-trust font-mono font-bold text-xs px-2 py-0.5 rounded-full border border-trust/20 shrink-0">
                          {bo.ownershipPct || 0}%
                        </div>
                      </div>

                      {/* Content Form */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Nom Complet</label>
                            <Input 
                              placeholder="Nom et Prénom"
                              value={bo.name} 
                              className="h-8 text-xs px-2"
                              onChange={e => updateOfficer(index, 'name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Rôle</label>
                            <Input 
                              placeholder="Ex: Gérant"
                              value={bo.role || ''} 
                              className="h-8 text-xs px-2"
                              onChange={e => updateOfficer(index, 'role', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Détention (%)</label>
                            <Input 
                              type="number"
                              placeholder="0"
                              value={bo.ownershipPct || 0} 
                              className="h-8 text-xs px-2"
                              onChange={e => updateOfficer(index, 'ownershipPct', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Nationalité</label>
                            <Input 
                              placeholder="Ex: Camerounaise"
                              value={bo.nationality || ''} 
                              className="h-8 text-xs px-2"
                              onChange={e => updateOfficer(index, 'nationality', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Email</label>
                          <Input 
                            type="email"
                            placeholder="email@exemple.com"
                            value={bo.email || ''} 
                            className="h-8 text-xs px-2"
                            onChange={e => updateOfficer(index, 'email', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {(!formData.beneficialOwners || formData.beneficialOwners.length === 0) && (
                <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">Aucun dirigeant renseigné. Ajoutez-en un pour compléter votre profil.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'docs' && (
          <Card className="glass border-white/10 overflow-hidden">
            <CardHeader className="bg-trust/10">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-trust" />
                Architecture Documentaire
              </CardTitle>
              <CardDescription className="text-trust/80">Structurez votre "Data Room" pour faciliter les audits et financements</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {[
                     { title: 'Identité & Gouvernance', icon: <Building2 />, types: ['STATUTS', 'RCCM', 'NUI'] },
                     { title: 'Finances & Fiscalité', icon: <TrendingUp />, types: ['ETATS_FINANCIERS', 'QUITANCE_IMPOTS'] },
                     { title: 'Opérations & Contrats', icon: <Users />, types: ['BAIL', 'CONTRAT_TRAVAIL'] }
                   ].map(cat => (
                     <div key={cat.title} className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-trust/20 rounded-lg text-trust">
                            {React.cloneElement(cat.icon as React.ReactElement, { size: 20 })}
                          </div>
                          <h3 className="font-bold">{cat.title}</h3>
                        </div>
                        <div className="space-y-2">
                           {cat.types.map(t => (
                             <div key={t} className="text-xs flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                                <span className="text-muted-foreground">{t}</span>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-trust hover:bg-trust/10 transition-colors" onClick={() => navigate('/documents')}>
                                  Gérer
                                </Button>
                             </div>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>
                
                <div className="p-6 border-2 border-dashed border-white/10 rounded-2xl text-center space-y-4">
                   <div className="p-4 bg-white/5 rounded-full w-fit mx-auto">
                     <FileText className="w-8 h-8 text-muted-foreground" />
                   </div>
                   <div>
                     <p className="font-bold">Module de Gestion Avancée</p>
                     <p className="text-sm text-muted-foreground">Accédez au tableau de bord de conformité pour uploader vos fichiers.</p>
                   </div>
                   <Button variant="trust" size="sm" asChild>
                     <a href="/compliance">Aller à la Conformité</a>
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
