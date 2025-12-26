import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { GameType, GameSettings as GameSettingsType } from '@/types';
import { Save, Clock, DollarSign, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const defaultSettings: Record<GameType, GameSettingsType> = {
  milhar: { tipo_jogo: 'milhar', valor_minimo: 1, valor_maximo: 100, multiplicador: 4000 },
  centena: { tipo_jogo: 'centena', valor_minimo: 1, valor_maximo: 200, multiplicador: 600 },
  dezena: { tipo_jogo: 'dezena', valor_minimo: 0.5, valor_maximo: 500, multiplicador: 60 },
};

const gameTypeInfo: Record<GameType, { label: string; digits: number; color: string }> = {
  milhar: { label: 'Milhar', digits: 4, color: 'milhar' },
  centena: { label: 'Centena', digits: 3, color: 'centena' },
  dezena: { label: 'Dezena', digits: 2, color: 'dezena' },
};

export function GameSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [horarios, setHorarios] = useState({
    abertura: '08:00',
    fechamento: '22:00',
    pausaInicio: '12:00',
    pausaFim: '14:00',
    pausaAtiva: false,
  });

  const handleSettingChange = (
    type: GameType, 
    field: keyof GameSettingsType, 
    value: number
  ) => {
    setSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Configure valores, horários e multiplicadores
          </p>
        </div>
        
        <Button variant="accent" size="lg" onClick={handleSave}>
          <Save className="w-5 h-5 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      {/* Game Types Settings */}
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(gameTypeInfo) as GameType[]).map((type) => (
          <div 
            key={type}
            className="glass-card rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                `game-badge-${type}`
              )}>
                <span className="font-bold text-lg">{gameTypeInfo[type].digits}d</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{gameTypeInfo[type].label}</h3>
                <p className="text-sm text-muted-foreground">
                  {gameTypeInfo[type].digits} dígitos
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Valor Mínimo</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={settings[type].valor_minimo}
                      onChange={(e) => handleSettingChange(type, 'valor_minimo', Number(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Valor Máximo</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={settings[type].valor_maximo}
                      onChange={(e) => handleSettingChange(type, 'valor_maximo', Number(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Multiplicador (Prêmio)</Label>
                <div className="relative">
                  <Trophy className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={settings[type].multiplicador}
                    onChange={(e) => handleSettingChange(type, 'multiplicador', Number(e.target.value))}
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Aposta de R$1 = Prêmio de {settings[type].multiplicador.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Operating Hours */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Horário de Funcionamento</h3>
            <p className="text-sm text-muted-foreground">
              Defina os horários de abertura e fechamento
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Abertura</Label>
            <Input
              type="time"
              value={horarios.abertura}
              onChange={(e) => setHorarios(prev => ({ ...prev, abertura: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Fechamento</Label>
            <Input
              type="time"
              value={horarios.fechamento}
              onChange={(e) => setHorarios(prev => ({ ...prev, fechamento: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Início Pausa</Label>
            <Input
              type="time"
              value={horarios.pausaInicio}
              onChange={(e) => setHorarios(prev => ({ ...prev, pausaInicio: e.target.value }))}
              disabled={!horarios.pausaAtiva}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Fim Pausa</Label>
            <Input
              type="time"
              value={horarios.pausaFim}
              onChange={(e) => setHorarios(prev => ({ ...prev, pausaFim: e.target.value }))}
              disabled={!horarios.pausaAtiva}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="font-medium text-foreground">Pausa para Almoço</p>
            <p className="text-sm text-muted-foreground">
              Bloqueia apostas durante o intervalo
            </p>
          </div>
          <Switch
            checked={horarios.pausaAtiva}
            onCheckedChange={(checked) => setHorarios(prev => ({ ...prev, pausaAtiva: checked }))}
          />
        </div>
      </div>
    </div>
  );
}
