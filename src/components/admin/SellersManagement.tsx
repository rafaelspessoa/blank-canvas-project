import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  UserPlus, 
  Edit2, 
  Trash2, 
  Ban, 
  CheckCircle,
  Search,
  MoreVertical,
  ShieldCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function SellersManagement() {
  const [sellers, setSellers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    usuario: '',
    email: '',
    senha: '',
    comissao: 10,
  });


  // Carregar vendedores do backend
  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    setIsLoading(true);
    try {
      // Primeiro busca o perfil do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Busca o profile do usuário atual para pegar o ID
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      // Busca todos os perfis exceto o do usuário atual
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentProfile?.id || '');

      if (error) throw error;

      // Busca os cargos de todos os perfis
      const profileIds = profiles?.map(p => p.auth_user_id) || [];
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', profileIds);

      // Mapeia os cargos por user_id
      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      const sellersData: User[] = (profiles || []).map((p: any) => ({
        id: p.id,
        nome: p.nome || '',
        usuario: p.usuario || '',
        perfil: rolesMap.get(p.auth_user_id) || 'vendedor',
        comissao: p.comissao || 0,
        status: p.status,
        created_at: p.created_at,
      }));

      setSellers(sellersData);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
      toast.error('Erro ao carregar vendedores');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.usuario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingSeller) {
        // Atualizar vendedor
        const { error } = await supabase.functions.invoke('manage-seller', {
          body: {
            action: 'update',
            data: {
              id: editingSeller.id,
              ...formData,
              perfil: editingSeller.perfil,
            },
          },
        });

        if (error) throw error;
        toast.success('Vendedor atualizado com sucesso!');
      } else {
        // Criar vendedor
        const { error } = await supabase.functions.invoke('manage-seller', {
          body: {
            action: 'create',
            data: {
              ...formData,
              perfil: 'vendedor',
            },
          },
        });

        if (error) throw error;
        toast.success('Vendedor criado com sucesso!');
      }

      await loadSellers();
      setDialogOpen(false);
      setEditingSeller(null);
      setFormData({ nome: '', usuario: '', email: '', senha: '', comissao: 10 });
    } catch (error: any) {
      console.error('Erro ao salvar vendedor:', error);
      toast.error(error.message || 'Erro ao salvar vendedor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (seller: User) => {
    setEditingSeller(seller);
    setFormData({
      nome: seller.nome,
      usuario: seller.usuario,
      email: '',
      senha: '',
      comissao: seller.comissao,
    });
    setDialogOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const seller = sellers.find(s => s.id === id);
      if (!seller) return;

      const { error } = await supabase.functions.invoke('manage-seller', {
        body: {
          action: 'update',
          data: {
            id,
            status: seller.status === 'ativo' ? 'bloqueado' : 'ativo',
          },
        },
      });

      if (error) throw error;

      await loadSellers();
      toast.success('Status atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleToggleRole = async (id: string) => {
    try {
      const seller = sellers.find(s => s.id === id);
      if (!seller) return;

      const { error } = await supabase.functions.invoke('manage-seller', {
        body: {
          action: 'update',
          data: {
            id,
            perfil: seller.perfil === 'vendedor' ? 'gerente' : 'vendedor',
          },
        },
      });

      if (error) throw error;

      await loadSellers();
      toast.success('Perfil atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este vendedor?')) return;

    try {
      const { error } = await supabase.functions.invoke('manage-seller', {
        body: {
          action: 'delete',
          data: { id },
        },
      });

      if (error) throw error;

      await loadSellers();
      toast.success('Vendedor removido!');
    } catch (error) {
      console.error('Erro ao remover vendedor:', error);
      toast.error('Erro ao remover vendedor');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Vendedores</h1>
          <p className="text-muted-foreground mt-1">
            {sellers.length} vendedores cadastrados
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" size="lg" className="w-full sm:w-auto">
              <UserPlus className="w-5 h-5 mr-2" />
              Novo Vendedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSeller ? 'Editar Vendedor' : 'Novo Vendedor'}
              </DialogTitle>
              <DialogDescription>
                {editingSeller 
                  ? 'Atualize os dados do vendedor' 
                  : 'Preencha os dados para criar um novo vendedor'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário</Label>
                <Input
                  id="usuario"
                  value={formData.usuario}
                  onChange={(e) => setFormData(prev => ({ ...prev, usuario: e.target.value }))}
                  placeholder="Ex: joao.silva"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ex: joao@exemplo.com"
                  required={!editingSeller}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">
                  {editingSeller ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
                  placeholder="••••••••"
                  required={!editingSeller}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comissao">Comissão (%)</Label>
                  <Input
                    id="comissao"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.comissao}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        comissao: Number(e.target.value),
                      }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingSeller(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="accent" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : (editingSeller ? 'Salvar' : 'Criar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar vendedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sellers Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando vendedores...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSellers.map((seller) => (
          <div 
            key={seller.id}
            className={cn(
              "glass-card rounded-xl p-4 transition-all duration-200 hover:shadow-lg",
              seller.status === 'bloqueado' && "opacity-60"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                  seller.status === 'ativo' 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {seller.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{seller.nome}</h3>
                  <p className="text-sm text-muted-foreground">@{seller.usuario}</p>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(seller)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleStatus(seller.id)}>
                    {seller.status === 'ativo' ? (
                      <>
                        <Ban className="w-4 h-4 mr-2" />
                        Bloquear
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleRole(seller.id)}>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    {seller.perfil === 'vendedor' ? 'Tornar Gerente' : 'Tornar Vendedor'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Comissão</p>
                <p className="font-semibold text-accent">{seller.comissao}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Limite</p>
                <p className="font-semibold text-foreground">
                  {(seller.limite_apostas || 0).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                seller.status === 'ativo' 
                  ? "bg-success/10 text-success" 
                  : "bg-destructive/10 text-destructive"
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  seller.status === 'ativo' ? "bg-success" : "bg-destructive"
                )} />
                {seller.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
              </span>
            </div>
          </div>
        ))}
        
        {filteredSellers.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum vendedor encontrado</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
