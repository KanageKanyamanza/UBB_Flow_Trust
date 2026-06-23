import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Building2, 
  MapPin, 
  FileText, 
  Download, 
  Landmark, 
  ArrowRightLeft, 
  Calendar, 
  LogOut, 
  Lock, 
  ShieldCheck, 
  HelpCircle,
  AlertCircle,
  FileCheck,
  TrendingUp,
  UserCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { BASE_URL } from '../../infrastructure/api/apiSlice'
import { 
  useGetPartnerProfileQuery,
  useGetPartnerAccountsQuery,
  useGetPartnerTransactionsQuery,
  useGetPartnerTrustScoreQuery,
  useGetPartnerDocumentsQuery
} from '../../infrastructure/api/partnerApi'
import { Seo } from '../components/seo/Seo'

const PartnerPortalPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tokenParam = searchParams.get('token')

  // Compute the token: try URL first, then localStorage
  const partnerToken = tokenParam || localStorage.getItem('partnerToken')

  useEffect(() => {
    if (tokenParam) {
      localStorage.setItem('partnerToken', tokenParam)
      // Clean URL parameter reactively to avoid race condition or first-load flash error
      setSearchParams({}, { replace: true })
    }
  }, [tokenParam, setSearchParams])

  // Log out partner and clear client session if any to prevent redirect loop to dashboard
  const handleExit = () => {
    localStorage.removeItem('partnerToken')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
  }

  // Fetch all endpoints
  const { data: profile, error: profileError, isLoading: profileLoading } = useGetPartnerProfileQuery(undefined, {
    skip: !partnerToken,
  })
  
  const { data: trustScore, error: trustError } = useGetPartnerTrustScoreQuery(undefined, {
    skip: !partnerToken,
  })

  const { data: accounts, error: accountsError, isLoading: accountsLoading } = useGetPartnerAccountsQuery(undefined, {
    skip: !partnerToken,
  })

  const { data: transactions, error: transactionsError, isLoading: transactionsLoading } = useGetPartnerTransactionsQuery(undefined, {
    skip: !partnerToken,
  })

  const { data: documents, error: documentsError, isLoading: documentsLoading } = useGetPartnerDocumentsQuery(undefined, {
    skip: !partnerToken,
  })

  // Loading Screen
  if (profileLoading && !profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trust mb-4"></div>
        <p className="text-muted-foreground">Authentification et chargement de la Data Room...</p>
      </div>
    )
  }

  // Error/No Token Screen
  const isUnauthorized = profileError && ('status' in profileError && (profileError.status === 401 || profileError.status === 403))
  if (!partnerToken || isUnauthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center max-w-md mx-auto animate-fade-in">
        <AlertCircle className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-2xl font-bold mb-2">Accès Non Autorisé</h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Le code d'accès de partage fourni est absent, expiré ou révoqué par le propriétaire de l'entreprise. 
          Veuillez demander un nouveau lien de consultation sécurisé.
        </p>
        <Button variant="trust" onClick={handleExit} className="w-full">
          Retour à la page de connexion
        </Button>
      </div>
    )
  }

  // Generic Error Screen
  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center max-w-md mx-auto animate-fade-in">
        <AlertCircle className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-2xl font-bold mb-2">Erreur de Connexion</h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Impossible de se connecter au serveur. Veuillez vérifier votre connexion.
        </p>
        <Button variant="trust" onClick={handleExit} className="w-full">
          Retour à la page de connexion
        </Button>
      </div>
    )
  }

  // Helper for unauthorized cards
  const isSectionRestricted = (error: any) => {
    return error && 'status' in error && (error.status === 403 || error.status === 401)
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 animate-fade-in">
      <Seo title="Portail Partenaire — Trust Lane" noindex />
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background/50 border border-white/10 p-6 rounded-2xl glass glow-trust">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-trust/20 rounded-xl">
            <Building2 className="w-8 h-8 text-trust" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">{profile?.legalName}</h1>
              <span className="bg-trust/10 text-trust text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-trust/20">
                <ShieldCheck className="w-3 h-3" /> Accès Partenaire
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              SIREN / N° : {profile?.registrationNo} &bull; {profile?.address}
            </p>
          </div>
        </div>

        <Button variant="ghost" className="text-muted-foreground hover:text-white border border-white/5 hover:bg-white/5 gap-2" onClick={handleExit}>
          <LogOut className="w-4 h-4" /> Quitter le Portail
        </Button>
      </div>

      {/* Grid: Trust Score and General Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Trust Card */}
        <Card className="glass border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-trust/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-trust/10 transition-all duration-300" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-trust" /> Score de Confiance
              </span>
              {trustScore && (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Fiable
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            {isSectionRestricted(trustError) ? (
              <div className="text-center p-4">
                <Lock className="w-8 h-8 mx-auto text-white/20 mb-2" />
                <p className="text-xs text-muted-foreground">Score masqué par l'émetteur</p>
              </div>
            ) : trustScore ? (
              <>
                <span className="text-6xl font-black text-white tracking-tight">{trustScore.score}<span className="text-2xl text-muted-foreground">/100</span></span>
                <span className="text-xl font-bold text-trust mt-2 tracking-wide">Grade {trustScore.grade}</span>
                <p className="text-xs text-muted-foreground text-center mt-3 leading-normal max-w-[200px]">
                  Score de confiance dynamique calculé à partir de la conformité documentaire et des flux.
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <HelpCircle className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2 animate-pulse" />
                <p className="text-xs text-muted-foreground">Aucun score disponible</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card className="glass border-white/10 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-trust" /> Profil & Actionnaires bénéficiaires
            </CardTitle>
            <CardDescription>Présentation générale de la entreprise émettrice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Activité & Description</h4>
              <p className="text-sm mt-1 text-white/90 leading-relaxed">
                {profile?.description || "Aucune description fournie par l'entreprise."}
              </p>
            </div>

            {profile?.beneficialOwners && profile.beneficialOwners.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-trust" /> Bénéficiaires Effectifs (UBO)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.beneficialOwners.map((ubo) => (
                    <div key={ubo.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{ubo.name}</p>
                        <p className="text-xs text-muted-foreground">{ubo.role}</p>
                      </div>
                      <span className="text-xs font-bold bg-trust/10 text-trust border border-trust/20 px-2 py-1 rounded-lg">
                        {ubo.ownershipPct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Accounts */}
      {isSectionRestricted(accountsError) ? (
        <Card className="glass border-white/10 opacity-70">
          <CardContent className="h-44 flex flex-col items-center justify-center text-center p-4">
            <Lock className="w-8 h-8 text-white/20 mb-2" />
            <p className="text-sm font-bold text-white/70">Comptes bancaires masqués</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Les comptes bancaires n'ont pas été partagés. Le périmètre requiert le scope <code className="bg-white/5 px-1 py-0.5 rounded text-[10px]">accounts:read</code>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Landmark className="w-5 h-5 text-flow" /> Comptes Bancaires Certifiés
            </CardTitle>
            <CardDescription>Soldes mis à jour en temps réel via Open Banking</CardDescription>
          </CardHeader>
          <CardContent>
            {accountsLoading ? (
              <div className="text-center py-6 text-muted-foreground">Chargement des comptes...</div>
            ) : accounts && accounts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {accounts.map((account) => (
                  <div key={account.id} className="p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{account.type}</p>
                    <p className="text-base font-semibold text-white mt-0.5 truncate">{account.name}</p>
                    <p className="text-2xl font-black text-white mt-4">
                      {account.balance.toLocaleString('fr-FR', { style: 'currency', currency: account.currency })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun compte bancaire configuré.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section Transactions */}
      {isSectionRestricted(transactionsError) ? (
        <Card className="glass border-white/10 opacity-70">
          <CardContent className="h-44 flex flex-col items-center justify-center text-center p-4">
            <Lock className="w-8 h-8 text-white/20 mb-2" />
            <p className="text-sm font-bold text-white/70">Historique des transactions masqué</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              L'historique des transactions n'est pas partagé. Le périmètre requiert le scope <code className="bg-white/5 px-1 py-0.5 rounded text-[10px]">transactions:read</code>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-flow" /> Historique de flux récent
            </CardTitle>
            <CardDescription>Les 50 dernières opérations bancaires créditrices et débitrices</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="text-center py-6 text-muted-foreground">Chargement des transactions...</div>
            ) : transactions && transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="pb-3 pl-2">Date</th>
                      <th className="pb-3">Opération</th>
                      <th className="pb-3">Catégorie</th>
                      <th className="pb-3 text-right pr-2">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-all text-sm">
                        <td className="py-3 pl-2 text-muted-foreground">
                          {new Date(tx.occurredAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 font-medium text-white">{tx.description}</td>
                        <td className="py-3">
                          <span className="bg-white/5 border border-white/5 text-white/80 px-2 py-0.5 rounded text-xs">
                            {tx.category}
                          </span>
                        </td>
                        <td className={`py-3 text-right font-black pr-2 ${tx.type === 'INFLOW' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type === 'INFLOW' ? '+' : '-'} {tx.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune transaction trouvée.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section Documents (Data Room) */}
      {isSectionRestricted(documentsError) ? (
        <Card className="glass border-white/10 opacity-70">
          <CardContent className="h-44 flex flex-col items-center justify-center text-center p-4">
            <Lock className="w-8 h-8 text-white/20 mb-2" />
            <p className="text-sm font-bold text-white/70">Data Room documentaire masquée</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Les documents officiels ne sont pas partagés. Le périmètre requiert le scope <code className="bg-white/5 px-1 py-0.5 rounded text-[10px]">documents:read</code>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-trust" /> Data Room Documentaire
            </CardTitle>
            <CardDescription>Documents d'entreprise certifiés et archivés</CardDescription>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="text-center py-6 text-muted-foreground">Chargement de la Data Room...</div>
            ) : documents && documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc) => {
                  const latestVersion = doc.versions?.[0]
                  return (
                    <div key={doc.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all flex justify-between items-start gap-4">
                      <div className="flex gap-3">
                        <div className="p-2.5 bg-trust/10 rounded-xl h-fit">
                          <FileText className="w-6 h-6 text-trust" />
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm line-clamp-1">{doc.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">{doc.type}</p>
                          {latestVersion && (
                            <p className="text-[10px] text-muted-foreground mt-2">
                              Mis à jour : {new Date(latestVersion.createdAt).toLocaleDateString('fr-FR')} &bull; {(latestVersion.fileSize / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {latestVersion && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-trust hover:bg-trust/10 border border-white/5 h-9 w-9"
                          asChild
                        >
                          <a 
                            href={`${BASE_URL}/partner/documents/${doc.id}/download?token=${partnerToken}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            download={latestVersion.fileName}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun document dans la Data Room.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bottom Legal Notice */}
      <div className="text-center text-xs text-muted-foreground flex justify-center gap-6 py-6 opacity-60">
        <span>Trust Lane Secure Gateway</span>
        <span>&bull;</span>
        <span>Données chiffrées de bout en bout</span>
      </div>
    </div>
  )
}

export default PartnerPortalPage
