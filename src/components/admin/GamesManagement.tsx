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

  const handleSubmit = async (e: React.FormEvent) => {
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
      await updateGame(updatedGame);
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
      await addGame(newGame);
      toast.success('Jogo criado com sucesso!');
    }

    handleCloseDialog();
  };

  const handleToggleActive = async (id: string) => {
    const game = games.find((g) => g.id === id);
    await toggleActive(id);
    toast.success(`Jogo ${game?.ativo ? 'desativado' : 'ativado'} com sucesso!`);
  };

  const handleDelete = async (id: string) => {
    await deleteGame(id);
    toast.success('Jogo excluído com sucesso!');
  };

  const handleTipoChange = (tipo: 'milhar' | 'centena') => {
    const multiplicador = tipo === 'milhar' ? 4000 : 600;
    setFormData((prev) => ({ ...prev, tipo, multiplicador }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestão de Jogos</h1>
          <p className="text-muted-foreground mt-1">Crie e configure os jogos disponíveis</p>
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
              <DialogTitle>{editingGame ? 'Editar Jogo' : 'Criar Novo Jogo'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Jogo</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Milhar Principal"
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
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
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        valor_minimo: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_maximo">Valor Máximo (R$)</Label>
                  <Input
                    id="valor_maximo"
                    type="number"
                    min="1"
                    value={formData.valor_maximo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        valor_maximo: Number(e.target.value),
                      }))
                    }
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horario_abertura">Abertura</Label>
                  <Input
                    id="horario_abertura"
                    type="time"
                    value={formData.horario_abertura}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        horario_abertura: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horario_fechamento">Fechamento</Label>
                  <Input
                    id="horario_fechamento"
                    type="time"
                    value={formData.horario_fechamento}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        horario_fechamento: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, ativo: checked }))
                    }
                  />
                  <Label htmlFor="ativo">Jogo ativo</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" variant="accent">
                  {editingGame ? 'Salvar alterações' : 'Criar jogo'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Listing */}
      <div className="glass-card rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <div
              key={game.id}
              className={cn(
                'rounded-lg border border-border bg-card p-4 shadow-sm',
                game.ativo ? 'opacity-100' : 'opacity-60',
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{game.nome}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleOpenDialog(game)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(game.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground mt-1">
                <span className="inline-flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  Prêmio: R$ {game.multiplicador}
                </span>
                <br />
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  R$ {game.valor_minimo} - R$ {game.valor_maximo}
                </span>
                <br />
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {game.horario_abertura} - {game.horario_fechamento}
                </span>
              </div>

              <Button
                variant="secondary"
                className="w-full mt-4"
                onClick={() => handleToggleActive(game.id)}
              >
                <Power className="w-4 h-4 mr-2" />
                {game.ativo ? 'Desativar Jogo' : 'Ativar Jogo'}
              </Button>
            </div>
          ))}
        </div>

        {games.length === 0 && (
          <div className="text-center text-muted-foreground">
            Nenhum jogo cadastrado. Comece criando um novo jogo!
          </div>
        )}
      </div>
    </div>
  );
}
