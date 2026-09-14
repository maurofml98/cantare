import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { store } from '../lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MusicStyle, UserObjective } from '../lib/types';

export const Route = createFileRoute('/auth')({
  component: () => <AuthPage />,
});

function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    style: 'Sertanejo' as MusicStyle,
    objective: 'Cantor de shows' as UserObjective,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.setUser({
      name: formData.name || formData.email.split('@')[0],
      email: formData.email,
      style: formData.style,
      objective: formData.objective,
    });
    navigate({ to: '/home' });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-10 relative z-10 animate-in">
        <div className="text-center space-y-3">
          <h1 className="font-serif text-7xl font-bold text-primary drop-shadow-[0_4px_12px_rgba(201,168,76,0.3)] tracking-tight">Cantare</h1>
          <p className="text-[10px] text-muted-foreground font-bold tracking-[0.4em] uppercase opacity-60">
            sua voz. seu palco.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-5">
            {!isLogin && (
              <div className="space-y-2 group">
                <Label htmlFor="name" className="text-[11px] uppercase tracking-widest text-muted-foreground/80 transition-colors group-focus-within:text-primary">Nome completo</Label>
                <Input
                  id="name"
                  required={!isLogin}
                  className="h-12 bg-white/[0.03] border-white/5 focus-visible:ring-primary focus-visible:border-primary/20 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Como quer ser chamado?"
                />
              </div>
            )}
            
            <div className="space-y-2 group">
              <Label htmlFor="email" className="text-[11px] uppercase tracking-widest text-muted-foreground/80 transition-colors group-focus-within:text-primary">Email</Label>
              <Input
                id="email"
                type="email"
                required
                className="h-12 bg-white/[0.03] border-white/5 focus-visible:ring-primary focus-visible:border-primary/20 transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2 group">
              <Label htmlFor="password" className="text-[11px] uppercase tracking-widest text-muted-foreground/80 transition-colors group-focus-within:text-primary">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                className="h-12 bg-white/[0.03] border-white/5 focus-visible:ring-primary focus-visible:border-primary/20 transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2 group">
                  <Label htmlFor="style" className="text-[11px] uppercase tracking-widest text-muted-foreground/80 transition-colors group-focus-within:text-primary">Estilo principal</Label>
                  <Select
                    value={formData.style}
                    onValueChange={(v) => setFormData({ ...formData, style: v as MusicStyle })}
                  >
                    <SelectTrigger className="h-12 bg-white/[0.03] border-white/5 focus:ring-primary">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      {['Sertanejo', 'MPB', 'Gospel', 'Rock', 'Pop', 'Pagode', 'Axé', 'Outro'].map((s) => (
                        <SelectItem key={s} value={s} className="focus:bg-primary/10">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="objective" className="text-[11px] uppercase tracking-widest text-muted-foreground/80 transition-colors group-focus-within:text-primary">Objetivo</Label>
                  <Select
                    value={formData.objective}
                    onValueChange={(v) => setFormData({ ...formData, objective: v as UserObjective })}
                  >
                    <SelectTrigger className="h-12 bg-white/[0.03] border-white/5 focus:ring-primary">
                      <SelectValue placeholder="Qual seu objetivo?" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      {['Cantor de shows', 'Gravação', 'Igreja/Louvor', 'Iniciante'].map((o) => (
                        <SelectItem key={o} value={o} className="focus:bg-primary/10">
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full h-14 text-lg bg-primary text-background font-bold hover:bg-primary/90 transition-all shadow-[0_8px_20px_-8px_rgba(201,168,76,0.4)] active:scale-[0.98]">
            {isLogin ? 'Entrar' : 'Criar minha conta'}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors p-2"
          >
            {isLogin ? 'Não tem uma conta? Criar conta' : 'Já tem uma conta? Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
}