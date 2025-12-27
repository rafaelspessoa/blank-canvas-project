import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GameType } from '@/types';
import { Plus, Edit2, Trash2, Trophy, DollarSign, Clock, Power } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Game, useGames } from '@/contexts/GamesContext';

const tipoInfo = {
  milhar: { label: 'Milhar', digits: 4, description: '4 dígitos (0000-9999)' },
  centena: { label: 'Centena', digits: 3, description: '3 dígitos (000-999)' },
};

export function GamesManagement() {
  const { games, addGame, updateGame, deleteGame, toggleActive } = useGames();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState<Partial<Game>>({
    nome: '',
    tipo: 'milhar',
    valor_minimo: 1,
    valor_maximo: 100,
    multiplicador: 4000,
    horario_abertura: '08:00',
    horario_fechamento: '22:00',
    ativo: true,
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'milhar',
      valor_minimo: 1,
      valor_maximo: 100,
      multiplicador: 4000,
      horario_abertura: '08:00',
      horario_fechamento: '22:00',
      ativo: true,
    });
    setEditingGame(null);
  };

  const handleOpenDialog = (game?: Game) => {
    if (game) {
      setEditingGame(game);
      setFormData(game);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome?.trim()) {
      toast.error('Informe o nome do jogo');
      return;
    }

    if (editingGame) {
      const updatedGame: Game = {
        ...(editingGame as Game),
        ...formData,
      } as Game;
      updateGame(updatedGame);
      toast.success('Jogo atualizado com sucesso!');
    } else {
      const newGame: Game = {
        id: Date.now().toString(),
        nome: formData.nome!,
        tipo: formData.tipo as 'milhar' | 'centena',
        valor_minimo: formData.valor_minimo!,
        valor_maximo: formData.valor_maximo!,
        multiplicador: formData.multiplicador!,
        horario_abertura: formData.horario_abertura!,
        horario_fechamento: formData.horario_fechamento!,
        ativo: formData.ativo!,
      };
      addGame(newGame);
      toast.success('Jogo criado com sucesso!');
    }
 
    handleCloseDialog();
  };

  const handleToggleActive = (id: string) => {
    const game = games.find((g) => g.id === id);
    toggleActive(id);
    toast.success(`Jogo ${game?.ativo ? 'desativado' : 'ativado'} com sucesso!`);
  };
 
  const handleDelete = (id: string) => {
    deleteGame(id);
    toast.success('Jogo excluído com sucesso!');
  };

  const handleTipoChange = (tipo: 'milhar' | 'centena') => {
    const multiplicador = tipo === 'milhar' ? 4000 : 600;
    setFormData(prev => ({ ...prev, tipo, multiplicador }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestão de Jogos</h1>
          <p className="text-muted-foreground mt-1">
            Crie e configure os jogos disponíveis
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="accent" size="lg" onClick={() => handleOpenDialog()}>
              <Plus className="w-5 h-5 mr-2" />
              Novo Jogo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGame ? 'Editar Jogo' : 'Criar Novo Jogo'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Jogo</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Milhar Principal"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Jogo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: 'milhar' | 'centena') => handleTipoChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="milhar">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Milhar</span>
                        <span className="text-muted-foreground text-xs">(4 dígitos)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="centena">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Centena</span>
                        <span className="text-muted-foreground text-xs">(3 dígitos)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {tipoInfo[formData.tipo as 'milhar' | 'centena']?.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_minimo">Valor Mínimo (R$)</Label>
                  <Input
                    id="valor_minimo"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.valor_minimo}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_minimo: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_maximo">Valor Máximo (R$)</Label>
                  <Input
                    id="valor_maximo"
                    type="number"
                    min="1"
                    value={formData.valor_maximo}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_maximo: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="multiplicador">Valor do Prêmio (R$)</Label>
                <div className="relative">
                  <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="multiplicador"
                    type="number"
                    min="1"
                    value={formData.multiplicador}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        multiplicador: Number(e.target.value),
                      }))
                    }
                    className="pl-9"
                  />
                </div>
                {typeof formData.multiplicador === 'number' && !Number.isNaN(formData.multiplicador) && (
                  <p className="text-xs text-muted-foreground">
                    {formData.multiplicador.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horario_abertura">Abertura</Label>
                  <Input
                    id="horario_abertura"
                    type="time"
                    value={formData.horario_abertura}
                    onChange={(e) => setFormData(prev => ({ ...prev, horario_abertura: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horario_fechamento">Fechamento</Label>
                  <Input
                    id="horario_fechamento"
                    type="time"
                    value={formData.horario_fechamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, horario_fechamento: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-medium text-foreground">Jogo Ativo</p>
                  <p className="text-sm text-muted-foreground">
                    Disponível para apostas
                  </p>
                </div>
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" variant="accent" className="flex-1">
                  {editingGame ? 'Salvar' : 'Criar Jogo'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Games Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <div 
            key={game.id}
            className={cn(
              "glass-card rounded-xl p-5 space-y-4 transition-all",
              !game.ativo && "opacity-60"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  `game-badge-${game.tipo}`
                )}>
                  <span className="font-bold text-lg">
                    {tipoInfo[game.tipo].digits}d
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{game.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tipoInfo[game.tipo].label}
                  </p>
                </div>
              </div>
              <div className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                game.ativo 
                  ? "bg-accent/20 text-accent" 
                  : "bg-destructive/20 text-destructive"
              )}>
                {game.ativo ? 'Ativo' : 'Inativo'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Min:</span>
                <span className="font-medium text-foreground">R$ {game.valor_minimo}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Máx:</span>
                <span className="font-medium text-foreground">R$ {game.valor_maximo}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Prêmio:</span>
                <span className="font-medium text-foreground">{game.multiplicador}x</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{game.horario_abertura} - {game.horario_fechamento}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleOpenDialog(game)}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleActive(game.id)}
              >
                <Power className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(game.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {games.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">Nenhum jogo cadastrado</h3>
          <p className="text-muted-foreground mt-1">
            Clique em "Novo Jogo" para criar o primeiro
          </p>
        </div>
      )}
    </div>
  );
}
