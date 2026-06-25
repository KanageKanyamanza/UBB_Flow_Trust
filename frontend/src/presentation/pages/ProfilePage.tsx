import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, Users, FileText, Save, Plus, Trash2, TrendingUp, ShieldAlert, Globe, Copy, ExternalLink, ShieldCheck, Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetPublicProfileStatusQuery,
  useSetupPublicProfileMutation
} from '@/infrastructure/api/profileApi'
import { useGetTrustScoreQuery } from '@/infrastructure/api/trustApi'
import { useAuth } from '@/application/context/AuthContext'
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from '@/infrastructure/pushNotifications'
import { Seo } from '@/presentation/components/seo/Seo'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general')
  const { data: profile, isLoading } = useGetProfileQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()

  // Public Profile State
  const { data: publicStatus } = useGetPublicProfileStatusQuery()
  const [setupPublicProfile, { isLoading: isSavingPublic }] = useSetupPublicProfileMutation()
  const { data: trustData } = useGetTrustScoreQuery()
  const [publicSlug, setPublicSlug] = useState('')
  const [publicActive, setPublicActive] = useState(false)
  const [copied, setCopied] = useState(false)

  // Push Notifications State
  const [pushEnabled, setPushEnabled] = useState(false)
  const [isTogglingPush, setIsTogglingPush] = useState(false)

  useEffect(() => {
    isPushSubscribed().then(setPushEnabled)
  }, [])

  const handleTogglePush = async () => {
    setIsTogglingPush(true)
    try {
      if (pushEnabled) {
        await unsubscribeFromPush()
        setPushEnabled(false)
      } else {
        const success = await subscribeToPush()
        setPushEnabled(success)
        if (!success) {
          alert(t('profile.notifications.errorEnable'))
        }
      }
    } finally {
      setIsTogglingPush(false)
    }
  }

  const isPublicDirty = publicStatus
    ? (publicSlug !== (publicStatus.slug || '') || publicActive !== (publicStatus.isActive || false))
    : false

  const [formData, setFormData] = useState<any>(null)

  useEffect(() => {
    if (profile) {
      setFormData(profile)
    }
  }, [profile])

  useEffect(() => {
    if (publicStatus) {
      setPublicSlug(publicStatus.slug || '')
      setPublicActive(publicStatus.isActive || false)
    }
  }, [publicStatus])

  // Only owners can access this page
  if (user?.role !== 'OWNER') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] md:h-screen text-center px-4 space-y-6 animate-fade-in">
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
          <ShieldAlert className="w-16 h-16 text-yellow-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">{t('profile.restrictedAccess')}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{t('profile.restrictedDesc')}</p>
        </div>
      </div>
    )
  }

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] md:h-screen w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trust"></div>
      </div>
    )
  }

  const handleSave = async () => {
    if (activeTab === 'public') {
      try {
        await setupPublicProfile({ slug: publicSlug, isActive: publicActive }).unwrap()
        alert(t('common.save') + ' OK')
      } catch (err: any) {
        alert(err?.data?.error || t('common.error'))
      }
      return
    }
    try {
      await updateProfile(formData).unwrap()
      alert(t('common.save') + ' OK')
    } catch (err) {
      alert(t('common.error'))
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
      <Seo title={`${t('pages.profile')} — ${t('brand.name')}`} noindex />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>
        <Button onClick={handleSave} disabled={isUpdating || isSavingPublic} variant="trust" className="gap-2 shadow-lg shadow-trust/20 w-full md:w-auto justify-center">
          <Save className="w-4 h-4" />
          {t('profile.save')}
        </Button>
      </div>

      <div className="flex overflow-x-auto gap-2 border-b border-white/10 mb-6 scrollbar-none pb-px">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 px-6 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'general' ? 'border-b-2 border-trust text-trust font-bold' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Building2 className="w-4 h-4" /> {t('profile.tabs.general')}
        </button>
        <button
          onClick={() => setActiveTab('officers')}
          className={`pb-3 px-6 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'officers' ? 'border-b-2 border-trust text-trust font-bold' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Users className="w-4 h-4" /> {t('profile.tabs.officers')}
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`pb-3 px-6 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'docs' ? 'border-b-2 border-trust text-trust font-bold' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <FileText className="w-4 h-4" /> {t('profile.tabs.docs')}
        </button>
        <button
          onClick={() => setActiveTab('public')}
          className={`pb-3 px-6 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'public' ? 'border-b-2 border-trust text-trust font-bold' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Globe className="w-4 h-4" /> {t('profile.tabs.public')}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 px-6 flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'notifications' ? 'border-b-2 border-trust text-trust font-bold' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Bell className="w-4 h-4" /> {t('profile.tabs.notifications')}
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-trust" />
                  {t('profile.general.legalIdentity')}
                </CardTitle>
                <CardDescription>{t('profile.general.legalIdentityDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('profile.general.legalName')}</label>
                  <Input
                    placeholder="Ex: Entreprise SARL"
                    value={formData.legalName}
                    onChange={e => setFormData({...formData, legalName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('profile.general.rccm')}</label>
                    <Input
                      placeholder="RCCM-..."
                      value={formData.registrationNo || ''}
                      onChange={e => setFormData({...formData, registrationNo: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('profile.general.taxId')}</label>
                    <Input
                      placeholder="M..."
                      value={formData.taxId || ''}
                      onChange={e => setFormData({...formData, taxId: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('profile.general.industry')}</label>
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
                  {t('profile.general.contact')}
                </CardTitle>
                <CardDescription>{t('profile.general.contactDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('profile.general.address')}</label>
                  <Input
                    placeholder="Quartier, Ville, Pays"
                    value={formData.address || ''}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('profile.general.email')}</label>
                    <Input
                      type="email"
                      placeholder="contact@entreprise.com"
                      value={formData.email || ''}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('profile.general.phone')}</label>
                    <Input
                      placeholder="+237 ..."
                      value={formData.phone || ''}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('profile.general.website')}</label>
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
                  {t('profile.officers.title')}
                </CardTitle>
                <CardDescription>{t('profile.officers.desc')}</CardDescription>
              </div>
              <Button onClick={addOfficer} variant="outline" size="sm" className="gap-2 border-trust/50 text-trust hover:bg-trust/10">
                <Plus className="w-4 h-4" /> {t('profile.officers.addMember')}
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
                          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">{t('profile.officers.officer')}</p>
                          <p className="font-bold text-sm truncate text-white">{bo.name || t('profile.officers.newMember')}</p>
                        </div>
                        <div className="bg-trust/10 text-trust font-mono font-bold text-xs px-2 py-0.5 rounded-full border border-trust/20 shrink-0">
                          {bo.ownershipPct || 0}%
                        </div>
                      </div>

                      {/* Content Form */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{t('profile.officers.name')}</label>
                            <Input
                              placeholder="Nom et Prénom"
                              value={bo.name} 
                              className="h-8 text-xs px-2"
                              onChange={e => updateOfficer(index, 'name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{t('profile.officers.role')}</label>
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
                  <p className="text-muted-foreground">{t('profile.officers.empty')}</p>
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
                {t('profile.docs.title')}
              </CardTitle>
              <CardDescription className="text-trust/80">{t('profile.docs.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {[
                     { title: t('profile.docs.govIdentity'), icon: <Building2 />, types: ['STATUTS', 'RCCM', 'NUI'] },
                     { title: t('profile.docs.finance'), icon: <TrendingUp />, types: ['ETATS_FINANCIERS', 'QUITANCE_IMPOTS'] },
                     { title: t('profile.docs.operations'), icon: <Users />, types: ['BAIL', 'CONTRAT_TRAVAIL'] }
                   ].map(cat => (
                     <div key={cat.title} className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-trust/20 rounded-lg text-trust">
                            {React.cloneElement(cat.icon as React.ReactElement, { size: 20 })}
                          </div>
                          <h3 className="font-bold">{cat.title}</h3>
                        </div>
                        <div className="space-y-2">
                           {cat.types.map(docType => (
                             <div key={docType} className="text-xs flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                                <span className="text-muted-foreground">{docType}</span>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-trust hover:bg-trust/10 transition-colors" onClick={() => navigate('/documents')}>
                                  {t('profile.docs.manage')}
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
                     <p className="font-bold">{t('profile.docs.advanced')}</p>
                     <p className="text-sm text-muted-foreground">{t('profile.docs.advancedDesc')}</p>
                   </div>
                   <Button variant="trust" size="sm" asChild>
                     <a href="/compliance">{t('profile.docs.goToCompliance')}</a>
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'public' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass border-white/10 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Globe className="w-5 h-5 text-trust animate-pulse" />
                  {t('profile.public.title')}
                </CardTitle>
                <CardDescription>{t('profile.public.desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-white">{t('profile.public.activate')}</p>
                    <p className="text-xs text-muted-foreground max-w-md">{t('profile.public.activateDesc')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublicActive(!publicActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${publicActive ? 'bg-trust' : 'bg-white/10'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${publicActive ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('profile.public.slug')}</label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-trust transition-all">
                      <span className="text-muted-foreground text-xs select-none pr-1">{window.location.origin}/p/</span>
                      <input
                        type="text"
                        placeholder="nom-de-votre-entreprise"
                        value={publicSlug}
                        onChange={e => setPublicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                        className="bg-transparent border-none outline-none text-white text-sm w-full py-2.5 font-medium"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t('profile.public.slugHint')}</p>
                </div>

                {publicActive && publicSlug && (
                  isPublicDirty ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-yellow-500">
                          <ShieldAlert className="w-4.5 h-4.5" />
                          <span className="text-xs font-bold uppercase tracking-wider">{t('profile.public.unsaved')}</span>
                        </div>
                        <Button
                          variant="trust"
                          size="sm"
                          onClick={handleSave}
                          disabled={isSavingPublic}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {t('common.save')}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('profile.public.unsavedDesc')}</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-trust/10 border border-trust/20 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-trust">
                          <ShieldCheck className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">{t('profile.public.online')}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/p/${publicSlug}`)
                              setCopied(true)
                              setTimeout(() => setCopied(false), 2000)
                            }}
                            className="h-8 text-xs text-trust hover:bg-trust/10 gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            {copied ? t('profile.public.copied') : t('profile.public.copy')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 text-xs text-white hover:bg-white/10 gap-1.5"
                          >
                            <a href={`/p/${publicSlug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5" />
                              {t('profile.public.view')}
                            </a>
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground select-all break-all font-mono bg-background/50 p-2 rounded-lg border border-white/5">
                        {window.location.origin}/p/{publicSlug}
                      </p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="glass border-white/10 overflow-hidden">
                <CardHeader className="bg-white/5 border-b border-white/10 py-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    {t('profile.public.previewCard')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-trust/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-flow/20 text-flow border border-flow/10 text-[9px] font-black uppercase tracking-wider mb-2">
                          <ShieldCheck className="w-3 h-3" /> SME Verified
                        </div>
                        <h4 className="font-bold text-white text-base truncate max-w-[140px]">{formData.legalName || 'Votre entreprise'}</h4>
                        <p className="text-[10px] text-muted-foreground">{formData.industry || 'Secteur d\'activité'}</p>
                      </div>
                      {trustData && (
                        <div className="text-right flex flex-col items-end">
                          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Score</span>
                          <span className="text-2xl font-black text-white font-mono">{trustData.score}</span>
                          <span className="text-[10px] text-trust font-bold tracking-widest">
                            {trustData.score >= 90 ? 'AAA' : trustData.score >= 80 ? 'AA' : trustData.score >= 70 ? 'A' : trustData.score >= 60 ? 'BBB' : trustData.score >= 50 ? 'BB' : 'B'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-muted-foreground leading-relaxed">
                    {t('profile.public.previewDesc')}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <Card className="glass border-white/10 max-w-3xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Bell className="w-5 h-5 text-trust" />
                {t('profile.notifications.title')}
              </CardTitle>
              <CardDescription>{t('profile.notifications.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="space-y-1">
                  <p className="font-bold text-sm text-white">{t('profile.notifications.enable')}</p>
                  <p className="text-xs text-muted-foreground max-w-md">{t('profile.notifications.enableDesc')}</p>
                </div>
                <button
                  type="button"
                  disabled={isTogglingPush}
                  onClick={handleTogglePush}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${pushEnabled ? 'bg-trust' : 'bg-white/10'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
