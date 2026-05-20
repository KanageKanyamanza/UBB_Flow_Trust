import React, { useState } from 'react'
import { Plus, Trash2, Edit3, ShieldAlert, Mail, User, Shield, Store, Calendar, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Modal } from '../components/ui/modal'
import { Input } from '../components/ui/input'
import { useAuth } from '../../application/context/AuthContext'
import { useGetAccountsQuery } from '../../infrastructure/api/accountApi'
import {
  useGetTeamMembersQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
  TeamMember
} from '../../infrastructure/api/teamApi'

const TeamPage: React.FC = () => {
  const { user } = useAuth()
  const { data: accounts } = useGetAccountsQuery()
  const { data: members, isLoading, error } = useGetTeamMembersQuery()
  
  const [createMember] = useCreateTeamMemberMutation()
  const [updateMember] = useUpdateTeamMemberMutation()
  const [deleteMember] = useDeleteTeamMemberMutation()

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  
  // Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState('AGENT')
  const [accountId, setAccountId] = useState('')

  // UI Status
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

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
            Seul le propriétaire principal de l'organisation peut configurer et gérer l'équipe ou les gérants de boutiques.
          </p>
        </div>
      </div>
    )
  }

  const handleOpenCreate = () => {
    setEditingMember(null)
    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setRole('AGENT')
    setAccountId('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member)
    setEmail(member.email)
    setPassword('')
    setFirstName(member.firstName || '')
    setLastName(member.lastName || '')
    setRole(member.role)
    setAccountId(member.accountId || '')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingMember) {
        // Edit flow
        const updateBody: any = {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          role,
          accountId: accountId === '' ? null : accountId,
        }
        await updateMember({ id: editingMember.id, body: updateBody }).unwrap()
        showNotification('success', `Le collaborateur ${email} a été mis à jour avec succès.`)
      } else {
        // Create flow
        if (!email) {
          showNotification('error', 'L\'adresse email est obligatoire.')
          return
        }
        await createMember({
          email,
          password: password || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          role,
          accountId: accountId === '' ? null : accountId,
        }).unwrap()
        showNotification('success', `Le collaborateur ${email} a été créé avec succès.`)
      }
      setIsModalOpen(false)
    } catch (err: any) {
      const errMsg = err?.data?.error || err?.message || 'Une erreur est survenue.'
      showNotification('error', errMsg)
    }
  }

  const handleDelete = async (member: TeamMember) => {
    if (window.confirm(`Êtes-vous sûr de vouloir retirer ${member.email} de l'équipe ?`)) {
      try {
        await deleteMember(member.id).unwrap()
        showNotification('success', `Le collaborateur ${member.email} a été retiré de l'équipe.`)
      } catch (err: any) {
        const errMsg = err?.data?.error || err?.message || 'Impossible de supprimer ce collaborateur.'
        showNotification('error', errMsg)
      }
    }
  }

  const getAccountName = (accId?: string | null) => {
    if (!accId) return 'Toutes les boutiques'
    const account = accounts?.find(a => a.id === accId)
    return account ? account.name : 'Boutique inconnue'
  }

  return (
    <div className="flex flex-col min-h-screen animate-fade-in bg-background">
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Notifications Bar */}
        {notification && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-md shadow-2xl transition-all animate-in slide-in-from-top duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Gestion de l'Équipe</h1>
            <p className="text-muted-foreground">Affectez des gérants ou des agents à des boutiques spécifiques et définissez leurs droits d'accès.</p>
          </div>
          <Button 
            variant="flow" 
            onClick={handleOpenCreate}
            className="gap-2 shadow-lg shadow-flow/20"
          >
            <Plus className="w-4 h-4" />
            Ajouter un Collaborateur
          </Button>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 glass rounded-2xl border border-red-500/20">
            <p className="text-red-400">Une erreur est survenue lors du chargement des collaborateurs.</p>
            <Button variant="ghost" onClick={() => window.location.reload()} className="mt-4">Réessayer</Button>
          </div>
        ) : members?.length === 0 ? (
          <div className="bg-muted/30 border border-white/5 rounded-2xl p-16 text-center flex flex-col items-center justify-center space-y-4">
            <User className="w-16 h-16 text-muted-foreground/20" />
            <div className="space-y-1">
              <h3 className="text-xl font-medium">Aucun collaborateur trouvé</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Commencez par inviter vos gérants de boutiques ou agents pour collaborer sur vos flux de trésorerie.
              </p>
            </div>
            <Button variant="secondary" className="mt-4" onClick={handleOpenCreate}>
              Ajouter un collaborateur
            </Button>
          </div>
        ) : (
          <div className="glass border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    <th className="px-6 py-4">Collaborateur</th>
                    <th className="px-6 py-4">Rôle</th>
                    <th className="px-6 py-4">Boutique / Périmètre</th>
                    <th className="px-6 py-4">Créé le</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {members?.map((member) => (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white font-bold border border-white/10 uppercase">
                            {member.firstName ? member.firstName[0] : member.email[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {member.firstName || member.lastName 
                                ? `${member.firstName || ''} ${member.lastName || ''}`.trim()
                                : 'Sans nom'}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail size={12} />
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          member.role === 'OWNER' 
                            ? 'bg-flow/10 text-flow border border-flow/20' 
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          <Shield size={12} />
                          {member.role === 'OWNER' ? 'Propriétaire' : 'Gérant / Agent'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-white">
                          <Store size={14} className="text-muted-foreground" />
                          {getAccountName(member.accountId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {new Date(member.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenEdit(member)}
                            className="text-muted-foreground hover:text-white rounded-full w-8 h-8 p-0"
                          >
                            <Edit3 size={16} />
                          </Button>
                          {member.role !== 'OWNER' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(member)}
                              className="text-red-400/70 hover:text-red-400 rounded-full w-8 h-8 p-0"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={editingMember ? "Modifier le Collaborateur" : "Ajouter un Collaborateur"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} /> Prénom
                </label>
                <Input 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  placeholder="Ex: Jean" 
                  className="bg-white/5 border-white/10 text-white rounded-xl focus:border-flow"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} /> Nom
                </label>
                <Input 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  placeholder="Ex: Dupont" 
                  className="bg-white/5 border-white/10 text-white rounded-xl focus:border-flow"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={14} /> Adresse Email
              </label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={!!editingMember}
                placeholder="Ex: jean.dupont@entreprise.com" 
                className="bg-white/5 border-white/10 text-white rounded-xl focus:border-flow disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={14} /> Mot de Passe {editingMember && "(Optionnel - Remplir pour modifier)"}
              </label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder={editingMember ? "Laisser vide pour ne pas changer" : "Mot de passe d'accès temporaire"} 
                className="bg-white/5 border-white/10 text-white rounded-xl focus:border-flow"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={14} /> Rôle
                </label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  disabled={editingMember?.role === 'OWNER'}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-white focus:outline-none focus:border-flow disabled:opacity-50"
                >
                  <option value="AGENT" className="bg-neutral-900">Gérant / Agent (Accès restreint)</option>
                  <option value="OWNER" className="bg-neutral-900">Propriétaire (Accès total)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Store size={14} /> Boutique Assignée
                </label>
                <select 
                  value={accountId} 
                  onChange={(e) => setAccountId(e.target.value)}
                  disabled={role === 'OWNER'}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-white focus:outline-none focus:border-flow disabled:opacity-50"
                >
                  <option value="" className="bg-neutral-900">Toutes les boutiques (Vue globale)</option>
                  {accounts?.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-neutral-900">
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
                {role === 'OWNER' && (
                  <p className="text-xs text-muted-foreground mt-1">Les propriétaires ont accès à toutes les boutiques par défaut.</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="flow">
                {editingMember ? "Mettre à jour" : "Ajouter le collaborateur"}
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  )
}

export default TeamPage
