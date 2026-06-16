import React from 'react'
import { useParams } from 'react-router-dom'
import { useGetPublicProfileQuery } from '@/infrastructure/api/profileApi'
import { Seo } from '@/presentation/components/seo/Seo'
import {
  ShieldCheck,
  Building2,
  Calendar,
  Users,
  Globe,
  MapPin,
  FileText,
  Mail,
  Phone,
  Activity,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'

export default function VerifiedSmePage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: publicProfile, isLoading, error } = useGetPublicProfileQuery(slug || '')

  const canonicalUrl = `https://ubbflow.app/p/${slug || ''}`

  if (isLoading) {
    return (
      <>
        <Seo
          title="Profil PME Certifié — UBBFlow"
          description="Chargement du profil de confiance certifié UBB Flow & Trust."
          canonical={canonicalUrl}
          noindex
        />
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trust mb-4"></div>
          <p className="text-sm text-muted-foreground animate-pulse">Chargement du profil sécurisé...</p>
        </div>
      </>
    )
  }

  if (error || !publicProfile) {
    return (
      <>
        <Seo
          title="Profil Inaccessible — UBBFlow"
          description="Ce profil public n'existe pas, ou a été configuré comme privé par l'organisation."
          canonical={canonicalUrl}
          noindex
        />
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4 text-center">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-full mb-6">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Profil Inaccessible</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            Ce profil public n'existe pas, ou a été configuré comme privé par l'organisation.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Retour à l'accueil
          </Button>
        </div>
      </>
    )
  }

  const { company, trust, publishedAt } = publicProfile
  const score = trust?.score ?? 0
  const grade = trust?.grade ?? 'N/A'

  // Define colors based on score
  const getScoreColor = (val: number) => {
    if (val >= 90) return 'text-emerald-400 border-emerald-400/20 bg-emerald-500/10'
    if (val >= 75) return 'text-trust border-trust/20 bg-trust/10'
    if (val >= 60) return 'text-yellow-400 border-yellow-400/20 bg-yellow-500/10'
    return 'text-rose-400 border-rose-400/20 bg-rose-500/10'
  }

  const pageTitle = `${company.legalName || 'Profil PME'} — Profil Certifié UBBFlow`
  const pageDescription = company.description
    || `Découvrez le profil de confiance certifié de ${company.legalName || 'cette PME'} : score de confiance, conformité et informations légales vérifiées par UBBFlow.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.legalName || 'PME',
    description: pageDescription,
    url: canonicalUrl,
    ...(company.website && { sameAs: [company.website.startsWith('http') ? company.website : `https://${company.website}`] }),
    ...(company.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: company.address,
        addressCountry: company.country || undefined,
      },
    }),
    ...(company.foundedDate && { foundingDate: company.foundedDate }),
    ...(company.industry && { knowsAbout: company.industry }),
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col justify-between">
      <Seo
        title={pageTitle}
        description={pageDescription}
        canonical={canonicalUrl}
        type="profile"
        jsonLd={jsonLd}
      />
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-gradient-to-b from-trust/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* Public Header */}
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-flow to-trust flex items-center justify-center font-black text-sm text-white select-none">
              U
            </div>
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-white to-muted-foreground bg-clip-text text-transparent">
              UBB <span className="text-flow font-bold">Flow</span>
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Certifié UBB
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full space-y-8 animate-fade-in">
        
        {/* Banner Card */}
        <div className="p-8 md:p-10 rounded-[2rem] bg-gradient-to-r from-card/80 to-card/40 border border-white/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10 text-[10px] font-black uppercase tracking-widest">
              SME Public Ledger
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              {company.legalName || 'Ma PME'}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {company.description || "Aucune description fournie par l'organisation."}
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-trust" /> {company.country || 'N/A'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-flow" /> {company.industry || 'Secteur Non Défini'}
              </span>
              {company.foundedDate && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-yellow-500" /> Fondé en {new Date(company.foundedDate).getFullYear()}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Trust Score circular visualization */}
          <div className="shrink-0 flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 min-w-[240px] md:self-stretch justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-trust/5 rounded-full blur-xl pointer-events-none" />
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trust Score</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black text-white font-mono tracking-tighter">{score}</span>
                <span className="text-muted-foreground text-sm">/100</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Généré le {trust ? new Date(trust.calculatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center shrink-0 shadow-lg ${getScoreColor(score)}`}>
              <span className="text-[9px] font-black uppercase tracking-wider opacity-60">Grade</span>
              <span className="text-xl font-black tracking-widest font-mono">{grade}</span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* General Information Card */}
          <Card className="glass border-white/10 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="w-5 h-5 text-trust" />
                Fiche d'Identité Légale
              </CardTitle>
              <CardDescription>Informations d'enregistrement officiel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Siège Social</span>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-trust shrink-0" />
                    {company.address || 'Non spécifiée'}
                  </p>
                </div>

                <div className="space-y-1.5 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Taille de l'entreprise</span>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-flow shrink-0" />
                    {company.employeeCount ? `${company.employeeCount} employés` : 'Non renseignée'}
                  </p>
                </div>
              </div>

              {/* Beneficial Owners / Leadership */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div>
                  <h3 className="font-bold text-base text-white">Dirigeants & Bénéficiaires Effectifs</h3>
                  <p className="text-xs text-muted-foreground">Structure de gouvernance validée et vérifiée</p>
                </div>

                {company.beneficialOwners && company.beneficialOwners.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {company.beneficialOwners.map((owner: any, index: number) => (
                      <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-trust/20 flex items-center justify-center text-trust font-black text-xs uppercase">
                            {owner.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{owner.name}</p>
                            <p className="text-[10px] text-muted-foreground">{owner.role || 'Associé'}</p>
                          </div>
                        </div>
                        <div className="bg-trust/10 text-trust border border-trust/10 font-bold font-mono text-[10px] px-2 py-0.5 rounded-full">
                          {owner.ownershipPct}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Aucune information sur les dirigeants déclarée.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact and Trust Breakdown */}
          <div className="space-y-6">
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-4.5 h-4.5 text-flow" />
                  Contact Public
                </CardTitle>
                <CardDescription>Canaux de contact autorisés</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.website && (
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors text-xs font-bold text-white"
                  >
                    <Globe className="w-4 h-4 text-flow" />
                    <span className="truncate">{company.website}</span>
                  </a>
                )}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-muted-foreground">
                  <Mail className="w-4 h-4 text-trust shrink-0" />
                  <span className="truncate text-white font-medium">Email d'entreprise crypté</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-muted-foreground">
                  <Phone className="w-4 h-4 text-yellow-500 shrink-0" />
                  <span className="truncate text-white font-medium">Téléphone vérifié</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-white/10 relative overflow-hidden">
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-flow/5 rounded-full blur-xl pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-trust" />
                  Score Pilier UBB
                </CardTitle>
                <CardDescription>Indice de santé financière & conformité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <p>
                  Ce score certifie la transparence opérationnelle et l'historique transactionnel de l'entreprise via notre protocole open banking sécurisé.
                </p>
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white mb-1">
                    <span>Niveau de Fiabilité</span>
                    <span className="text-trust">{score >= 80 ? 'Optimal' : score >= 60 ? 'Satisfaisant' : 'Moyen'}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-trust h-1.5 rounded-full transition-all"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </main>

      {/* Public Footer */}
      <footer className="border-t border-white/5 py-8 mt-12 bg-card/20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} UBB Flow Trust. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-flow" /> Cryptage Banque
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-trust" /> Registre Public SME
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
