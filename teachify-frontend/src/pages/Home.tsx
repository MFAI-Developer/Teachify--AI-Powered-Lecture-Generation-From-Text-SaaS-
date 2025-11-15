import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, FileText, Video, CheckCircle } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative border-b border-border/60 animate-soft-fade">
        {/* subtle hero glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          aria-hidden="true"
        >
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),transparent_55%),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),transparent_55%)]" />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            {/* Left: text & actions */}
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                AI-powered lecture studio for modern educators
              </div>

              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground">
                  Turn ideas into
                  <span className="glow-text"> lecture videos</span>{' '}
                  in minutes.
                </h1>
                <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-xl">
                  Teachify helps you generate structured, avatar-led lecture
                  videos from prompts or documents — perfect for students aged
                  18–35 who learn visually and fast.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {isAuthenticated ? (
                  <Button
                    size="lg"
                    className="text-base md:text-lg px-8"
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="text-base md:text-lg px-8"
                      onClick={() => navigate('/signup')}
                    >
                      Get Started Free
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-base md:text-lg px-8"
                      onClick={() => navigate('/login')}
                    >
                      Try Demo
                    </Button>
                  </>
                )}
              </div>

              <div className="mt-4 grid gap-3 text-xs md:text-sm text-muted-foreground sm:grid-cols-3 max-w-md">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400">
                    <Sparkles className="h-3 w-3" />
                  </span>
                  <span>10x faster content production</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
                    <Video className="h-3 w-3" />
                  </span>
                  <span>AI avatar & synced captions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <FileText className="h-3 w-3" />
                  </span>
                  <span>Works with prompts & docs</span>
                </div>
              </div>
            </div>

            {/* Right: preview panel */}
            <div className="relative z-10 animate-rise">
              <Card className="glass-panel p-5 md:p-6 lg:p-7 shimmer-border">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="section-title">Live preview</p>
                    <h2 className="text-lg md:text-xl font-semibold tracking-tight">
                      AI Lecture Canvas
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Generating in real time</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-background/90 p-4 shadow-inner">
                  <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
                    <span className="px-2 py-1 rounded-full bg-sky-500/10 text-sky-400 font-medium">
                      Topic: Neural Networks 101
                    </span>
                    <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                      Avatar: Enabled
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <div className="space-y-2 text-xs md:text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        <span>Introduction · 00:00 – 01:30</span>
                      </div>
                      <p className="rounded-xl bg-slate-950/5 px-3 py-2 text-foreground">
                        “In this lecture, we’ll explore how neurons connect,
                        activate, and learn patterns from data…”
                      </p>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                        <span>Main body · 01:30 – 06:45</span>
                      </div>
                      <p className="rounded-xl bg-slate-950/5 px-3 py-2 text-foreground">
                        Key concepts: layers, weights, activation functions,
                        backpropagation, and gradient descent.
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-between gap-3">
                      <div className="relative aspect-video w-full rounded-xl border border-border bg-black/80 flex items-center justify-center overflow-hidden shadow-lg">
                        {/* Continuous orbit effect + glowing core */}
                        <div className="absolute h-32 w-32 rounded-full border border-sky-500/40 hero-orbit" />
                        <div className="absolute h-44 w-44 rounded-full border border-indigo-500/25 opacity-80 hero-orbit-delayed" />
                        <div className="relative h-16 w-16 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-violet-500 glow-pulse-soft shadow-[0_0_40px_rgba(56,189,248,0.65)]" />
                      </div>
                      <div className="flex w-full items-center justify-between text-[11px] text-muted-foreground">
                        <span>Visuals: Auto-generated</span>
                        <span>Captions: Synced</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-center mb-10">
            How It Works
          </h2>
          <div className="grid max-w-5xl mx-auto gap-6 md:grid-cols-3">
            <Card className="glass-panel group p-6 text-center transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_18px_40px_rgba(15,23,42,0.18)] animate-rise">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Enter your topic</h3>
              <p className="text-muted-foreground text-sm">
                Type a prompt or upload your material. Be as detailed as you
                like — audience, depth, style.
              </p>
            </Card>

            <Card className="glass-panel group p-6 text-center transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_18px_40px_rgba(15,23,42,0.18)] animate-rise">
              <div className="bg-secondary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                2. AI builds your lecture
              </h3>
              <p className="text-muted-foreground text-sm">
                Teachify structures the content, generates visuals, and prepares
                avatar narration.
              </p>
            </Card>

            <Card className="glass-panel group p-6 text-center transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_18px_40px_rgba(15,23,42,0.18)] animate-rise">
              <div className="bg-success/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Video className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Get your video</h3>
              <p className="text-muted-foreground text-sm">
                Review the lecture in the player, then download the final video
                ready to share.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold text-center mb-10">
              Why Choose Teachify?
            </h2>
            <div className="space-y-5">
              {[
                'Save hours creating educational content',
                'Professional-quality videos with AI avatars',
                'Generate from any topic or your own documents',
                'Consistent, engaging presentations every time',
                'Perfect for educators, trainers, and content creators',
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm animate-rise"
                >
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-1" />
                  <p className="text-sm md:text-base text-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-primary py-16 md:py-20 text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.45),transparent_55%)]" />
        </div>
        <div className="relative container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-semibold text-primary-foreground mb-4">
            Ready to transform your teaching?
          </h2>
          <p className="text-base md:text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join educators worldwide who are creating better content faster with
            Teachify.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-base md:text-lg px-8"
            onClick={() => navigate('/signup')}
          >
            Start creating today
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
