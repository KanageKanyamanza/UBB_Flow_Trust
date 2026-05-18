import React, { useState } from 'react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useCreateConsentGrantMutation } from '../../../infrastructure/api/consentGrantApi'
import { Copy, Check, ExternalLink } from 'lucide-react'

interface CreateConsentGrantModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateConsentGrantModal: React.FC<CreateConsentGrantModalProps> = ({ isOpen, onClose }) => {
  const [partnerName, setPartnerName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [scope, setScope] = useState('profile:read')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState('')
  const [generatedToken, setGeneratedToken] = useState('')
  const [copied, setCopied] = useState(false)
  
  const [createGrant, { isLoading }] = useCreateConsentGrantMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!partnerName.trim()) return setError('Le nom du partenaire est requis')
    if (!purpose.trim()) return setError('Le but de l\'accès est requis')
    if (!expiresAt) return setError('La date d\'expiration est requise')
    
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
    setExpiresAt('')
    setError('')
    onClose()
  }

  if (generatedToken) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Accès Partenaire Généré">
        <div className="space-y-6">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            L'accord de consentement a été créé avec succès. Veuillez copier le token ci-dessous et le transmettre à votre partenaire. 
            <strong className="block mt-2">Attention : ce token ne sera plus affiché après la fermeture de cette fenêtre.</strong>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Token d'accès (JWT)</label>
            <div className="relative">
              <textarea 
                readOnly
                value={generatedToken}
                className="w-full h-32 p-3 text-xs font-mono bg-background/50 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-trust resize-none"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopy}
                className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-white/10"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <ExternalLink size={14} className="text-trust" />
              Comment l'utiliser ?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Le partenaire doit inclure ce token dans le header <code>Authorization</code> de ses requêtes HTTP :
              <code className="block mt-2 p-2 bg-black/30 rounded border border-white/5 text-trust">
                Authorization: Bearer [TOKEN]
              </code>
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="trust" onClick={handleClose} className="w-full sm:w-auto">
              J'ai copié le token
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Autoriser un Partenaire">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Périmètre d'accès (Scopes)</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background/50 glass px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <option value="profile:read">Profil seulement</option>
            <option value="profile:read transactions:read">Profil + Transactions</option>
            <option value="profile:read transactions:read trust:read">Accès complet (UBB Trust)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Date d'expiration</label>
          <Input 
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="glass"
          />
          <p className="text-[10px] text-muted-foreground italic">L'accès sera automatiquement révoqué après cette date.</p>
        </div>

        {error && <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}

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
