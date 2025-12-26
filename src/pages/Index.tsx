import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:py-5">
          <span className="text-sm font-medium tracking-tight text-muted-foreground">simple.white</span>
          <nav className="hidden gap-6 text-xs font-medium text-muted-foreground sm:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Recursos
            </a>
            <a href="#about" className="transition-colors hover:text-foreground">
              Sobre
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="flex flex-col gap-10 py-14 sm:py-20 md:flex-row md:items-center md:gap-16">
          <div className="flex-1 space-y-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Projeto simples</p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Um ponto de partida limpo em branco para suas ideias.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Comece rápido com uma base minimalista: layout claro, tipografia discreta e componentes prontos para você
              customizar como quiser.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Button>{"Começar agora"}</Button>
              <span className="text-xs text-muted-foreground">Nenhuma distração. Só o essencial.</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="group rounded-lg border border-border/70 bg-card/40 p-4 transition-transform duration-200 ease-out hover:-translate-y-1">
                <h2 className="mb-1 text-sm font-medium tracking-tight">Visual minimalista</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Fundo branco, contrastes suaves e muito espaço em branco para destacar o conteúdo.
                </p>
              </article>
              <article className="group rounded-lg border border-border/70 bg-card/40 p-4 transition-transform duration-200 ease-out hover:-translate-y-1">
                <h2 className="mb-1 text-sm font-medium tracking-tight">Pronto para escalar</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Base em React, Tailwind e componentes reutilizáveis para crescer junto com o projeto.
                </p>
              </article>
              <article className="group rounded-lg border border-border/70 bg-card/40 p-4 transition-transform duration-200 ease-out hover:-translate-y-1 sm:col-span-2">
                <h2 className="mb-1 text-sm font-medium tracking-tight">Foque no que importa</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Use esta estrutura como canvas em branco: ajuste textos, cores e layouts conforme a necessidade, sem
                  precisar refazer o básico.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-dashed border-border/60 py-10 sm:py-12">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-1">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Leve</h2>
              <p className="text-sm text-foreground">Sem elementos desnecessários, apenas o que você precisa para começar.</p>
            </div>
            <div className="space-y-1">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Organizado</h2>
              <p className="text-sm text-foreground">Componentes separados e prontos para evolução do design.</p>
            </div>
            <div className="space-y-1">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Responsivo</h2>
              <p className="text-sm text-foreground">Funciona bem em telas pequenas e grandes desde o início.</p>
            </div>
          </div>
        </section>

        <section id="about" className="border-t border-dashed border-border/60 py-8 sm:py-10">
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Este projeto foi pensado para ser um ponto de partida neutro: simples, claro e fácil de adaptar. Altere o
            conteúdo, adicione novas páginas ou mude completamente o layout — a base continua minimalista e organizada.
          </p>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <p className="text-[11px] text-muted-foreground">Projeto simples em branco • Feito com React + Tailwind</p>
          <a href="#top" className="text-[11px] text-muted-foreground underline-offset-4 hover:underline">
            Voltar ao topo
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
