import React, { useState } from 'react';
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
  MoreVertical
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

// Mock sellers data
const mockSellers: User[] = [
  {
    id: '2',
    nome: 'João Vendedor',
    usuario: 'joao',
    perfil: 'vendedor',
    comissao: 10,
    status: 'ativo',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    nome: 'Maria Vendedora',
    usuario: 'maria',
    perfil: 'vendedor',
    comissao: 12,
    status: 'ativo',
    created_at: '2024-01-20T14:30:00Z',
  },
  {
    id: '4',
    nome: 'Pedro Santos',
    usuario: 'pedro',
    perfil: 'vendedor',
    comissao: 8,
    status: 'bloqueado',
    created_at: '2024-02-01T09:00:00Z',
  },
];

export function SellersManagement() {
  const [sellers, setSellers] = useState<User[]>(mockSellers);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    usuario: '',
    senha: '',
    comissao: 10,
  });

  const filteredSellers = sellers.filter(seller =>
    seller.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.usuario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSeller) {
      setSellers(prev => prev.map(s => 
        s.id === editingSeller.id 
          ? { ...s, ...formData }
          : s
      ));
      toast.success('Vendedor atualizado com sucesso!');
    } else {
      const newSeller: User = {
        id: Date.now().toString(),
        ...formData,
        perfil: 'vendedor',
        status: 'ativo',
        created_at: new Date().toISOString(),
      };
      setSellers(prev => [...prev, newSeller]);
      toast.success('Vendedor criado com sucesso!');
    }
    
    setDialogOpen(false);
    setEditingSeller(null);
    setFormData({ nome: '', usuario: '', senha: '', comissao: 10 });
  };

  const handleEdit = (seller: User) => {
    setEditingSeller(seller);
    setFormData({
      nome: seller.nome,
      usuario: seller.usuario,
      senha: '',
      comissao: seller.comissao,
    });
    setDialogOpen(true);
  };

  const handleToggleStatus = (id: string) => {
    setSellers(prev => prev.map(s => 
      s.id === id 
        ? { ...s, status: s.status === 'ativo' ? 'bloqueado' : 'ativo' }
        : s
    ));
    toast.success('Status atualizado!');
  };

  const handleDelete = (id: string) => {
    setSellers(prev => prev.filter(s => s.id !== id));
    toast.success('Vendedor removido!');
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
                <Button type="submit" variant="accent" className="flex-1">
                  {editingSeller ? 'Salvar' : 'Criar'}
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
                  <DropdownMenuItem 
                    onClick={() => handleDelete(seller.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
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
      </div>

      {filteredSellers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum vendedor encontrado</p>
        </div>
      )}
    </div>
  );
}
