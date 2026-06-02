import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useCreateConsentGrantMutation } from '../../../infrastructure/api/consentGrantApi'
import { Copy, Check, ExternalLink, ShieldAlert, Key } from 'lucide-react'

interface CreateConsentGrantModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateConsentGrantModal: React.FC<CreateConsentGrantModalProps> = ({ isOpen, onClose }) => {
  const [partnerName, setPartnerName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [scope, setScope] = useState('profile:read')
  const [durationPreset, setDurationPreset] = useState<'1h' | '1d' | '7d' | '30d' | 'custom'>('1d')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState('')
  const [generatedToken, setGeneratedToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [createGrant, { isLoading }] = useCreateConsentGrantMutation()

  // Update expiresAt automatically when preset changes
  useEffect(() => {
    if (durationPreset !== 'custom') {
      const now = new Date()
      if (durationPreset === '1h') now.setHours(now.getHours() + 1)
      else if (durationPreset === '1d') now.setDate(now.getDate() + 1)
      else if (durationPreset === '7d') now.setDate(now.getDate() + 7)
      else if (durationPreset === '30d') now.setDate(now.getDate() + 30)
      
      // format to datetime-local local string format (YYYY-MM-DDTHH:mm)
      const tzoffset = now.getTimezoneOffset() * 60000 // offset in milliseconds
      const localISOTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16)
      setExpiresAt(localISOTime)
    }
  }, [durationPreset, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!partnerName.trim()) return setError('Le nom du partenaire est requis')
    if (!purpose.trim()) return setError('Le but de l\'accès est requis')
    if (!expiresAt) return setError('La date d\'expiration est requise')
    if (new Date(expiresAt).getTime() <= Date.now()) {
      return setError('La date d\'expiration doit être dans le futur')
    }
    
    try {
      const result = await createGrant({
        partnerName,
        purpose,
        scope,
        expiresAt: new Date(expiresAt).toISOString()
      }).unwrap()
      
      setGeneratedToken(result.token)
    } catch (err: any) {
      setError(err?.data?.error || 'Une erreur est survenue lors de la création du consentement')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setGeneratedToken('')
    setPartnerName('')
    setPurpose('')
    setScope('profile:read')
    setDurationPreset('1d')
    setExpiresAt('')
    setError('')
    onClose()
  }

  if (generatedToken) {
    const directShareLink = `${window.location.origin}/partner/portal?token=${generatedToken}`
    
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Accès Partenaire Généré">
        <div className="space-y-6">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-start gap-3 animate-fade-in">
            <Key className="w-5 h-5 shrink-0 mt-0.5 text-green-400" />
            <div>
              <p className="font-bold">L'accord de consentement a été créé avec succès.</p>
              <p className="mt-1 text-xs opacity-90 leading-relaxed">
                Vous pouvez transmettre le lien direct ou le token ci-dessous à votre partenaire pour lui donner un accès temporaire et sécurisé.
                <strong className="block mt-1 font-semibold text-white">Attention : ces informations ne seront plus affichées après la fermeture de cette fenêtre.</strong>
              </p>
            </div>
          </div>

          {/* Direct Sharing Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px] flex items-center gap-1">
              <ExternalLink size={12} className="text-trust" /> Lien de consultation direct (Recommandé)
            </label>
            <div className="relative">
              <input 
                type="text"
                readOnly
                value={directShareLink}
                className="w-full p-3 pr-12 text-xs bg-background/50 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-trust"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  navigator.clipboard.writeText(directShareLink)
                  setCopiedLink(true)
                  setTimeout(() => setCopiedLink(false), 2000)
                }}
                className="absolute top-1.5 right-1.5 h-8 w-8 p-0 hover:bg-white/10 bg-background/80"
              >
                {copiedLink ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Votre partenaire n'aura qu'à cliquer sur ce lien sécurisé pour accéder au portail en un clic.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Token d'accès brut (JWT)</label>
            <div className="relative">
              <textarea 
                readOnly
                value={generatedToken}
                className="w-full h-24 p-3 text-xs font-mono bg-background/50 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-trust resize-none"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopy}
                className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-white/10 bg-background/80"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="trust" onClick={handleClose} className="w-full">
              Terminer
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Autoriser un Partenaire">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Nom du Partenaire</label>
          <Input 
            placeholder="Ex: CreditBank, AuditCorp..."
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            className="glass"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">But de l'accès</label>
          <Input 
            placeholder="Ex: Analyse de solvabilité pour prêt..."
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="glass"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Périmètre d'accès (Scope)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => setScope('profile:read')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                scope === 'profile:read' 
                  ? 'bg-trust/10 border-trust text-trust' 
                  : 'bg-white/5 border-white/10 hover:border-white/20 text-muted-foreground hover:text-white'
              }`}
            >
              <div>
                <h4 className={`font-bold text-sm mb-1 ${scope === 'profile:read' ? 'text-trust' : 'text-white'}`}>Vue Profil</h4>
                <p className="text-xs leading-relaxed opacity-85">
                  Permet uniquement de consulter les informations de base de la PME et l'identité des fondateurs (UBO).
                </p>
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest mt-4 opacity-50">profile:read</span>
            </div>

            <div 
              onClick={() => setScope('*')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                scope === '*' 
                  ? 'bg-trust/10 border-trust text-trust' 
                  : 'bg-white/5 border-white/10 hover:border-white/20 text-muted-foreground hover:text-white'
              }`}
            >
              <div>
                <h4 className={`font-bold text-sm mb-1 ${scope === '*' ? 'text-trust' : 'text-white'}`}>Vue Tout</h4>
                <p className="text-xs leading-relaxed opacity-85">
                  Accès total en lecture : Profil PME, UBOs, Comptes, Transactions, Checklists et documents de la Data Room.
                </p>
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest mt-4 opacity-50">Accès total (*)</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Durée de validité</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { val: '1h', label: '1 Heure' },
              { val: '1d', label: '1 Jour' },
              { val: '7d', label: '7 Jours' },
              { val: '30d', label: '30 Jours' },
              { val: 'custom', label: 'Perso.' }
            ].map((preset) => (
              <Button
                key={preset.val}
                type="button"
                variant={durationPreset === preset.val ? 'trust' : 'ghost'}
                className={`h-9 text-xs rounded-xl border ${
                  durationPreset === preset.val 
                    ? 'border-trust bg-trust/10 text-trust' 
                    : 'border-white/10 hover:bg-white/5 text-muted-foreground'
                }`}
                onClick={() => setDurationPreset(preset.val as any)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          
          {durationPreset === 'custom' && (
            <div className="pt-2 animate-fade-in">
              <Input 
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="glass"
              />
            </div>
          )}
          <p className="text-[10px] text-muted-foreground italic">
            {durationPreset !== 'custom' && expiresAt 
              ? `L'accès expirera automatiquement le : ${new Date(expiresAt).toLocaleString()}` 
              : "L'accès sera automatiquement révoqué après la date configurée."}
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 flex items-center gap-2">
            <ShieldAlert size={14} />
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="ghost" type="button" onClick={handleClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button variant="trust" type="submit" disabled={isLoading} className="shadow-lg shadow-trust/20">
            {isLoading ? 'Génération...' : 'Générer l\'accès'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
