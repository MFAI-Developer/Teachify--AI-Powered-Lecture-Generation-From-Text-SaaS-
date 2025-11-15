import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, FileText, Clock, Activity, Film } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8 md:py-10 lg:py-12">
        {/* Welcome Banner */}
        <div className="mb-10 animate-soft-fade">
          <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-6 py-7 text-primary-foreground shadow-[0_22px_55px_rgba(15,23,42,0.45)] md:px-8 md:py-8 lg:px-10 lg:py-9 shimmer-border">
            {/* Subtle glow overlay */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-40"
            >
              <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.55),transparent_55%)]" />
            </div>

            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="section-title text-sky-50/80">Welcome back</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
                  {user?.username ? `Welcome back, ${user.username}!` : 'Welcome back!'}
                </h1>
                <p className="mt-2 max-w-xl text-sm md:text-base text-sky-50/90">
                  Ready to create your next AI-powered lecture? Pick a quick action below to start
                  from a prompt or from your documents.
                </p>
              </div>

              <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-sky-100/35 bg-sky-900/10 px-4 py-3 text-xs md:mt-0 md:text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="uppercase tracking-[0.18em] text-sky-50/90 font-medium">
                    Workspace status
                  </span>
                </div>
                <p className="text-sky-50/85">
                  Start with a clear topic and audience. Teachify will handle structure, visuals, and
                  narration for you.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tiny status strip */}
        <div className="mb-8 grid gap-4 md:grid-cols-3 animate-rise">
          <Card className="glass-panel p-4 flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="font-medium text-foreground">Workspace</span>
            </div>
            <span className="text-muted-foreground">Ready to generate</span>
          </Card>
          <Card className="glass-panel p-4 flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-sky-400" />
              <span className="font-medium text-foreground">Video output</span>
            </div>
            <span className="text-muted-foreground">HD avatar lectures</span>
          </Card>
          <Card className="glass-panel p-4 flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-400" />
              <span className="font-medium text-foreground">Compilation</span>
            </div>
            <span className="text-muted-foreground">Background rendering</span>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-title">Workspace</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                Quick actions
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose how you want to create your next lecture video.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card
              className="group cursor-pointer glass-panel p-6 md:p-7 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_22px_55px_rgba(15,23,42,0.3)]"
              onClick={() => navigate('/generate')}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 transition-colors duration-200 group-hover:bg-sky-500/15 group-hover:text-sky-300">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold md:text-xl">Generate from prompt</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Describe any topic and let Teachify generate a complete lecture video structure
                    for you.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Ideal for new course ideas and quick experiments.</span>
                  </div>
                  <div className="mt-4">
                    <Button size="sm">Start generating</Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card
              className="group cursor-pointer glass-panel p-6 md:p-7 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_22px_55px_rgba(15,23,42,0.3)]"
              onClick={() => navigate('/generate-docs')}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-colors duration-200 group-hover:bg-emerald-500/15 group-hover:text-emerald-300">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold md:text-xl">Generate from documents</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload your PDFs, docs, or text files to create grounded lecture content based
                    on your own material.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
                    <span>Perfect for research notes, slide decks, and handouts.</span>
                  </div>
                  <div className="mt-4">
                    <Button size="sm" variant="secondary">
                      Upload documents
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Lectures */}
        <div className="space-y-5 animate-soft-fade">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="section-title">History</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                Recent lectures
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Once you start generating, your latest lectures will appear here.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/history')}>
                View all
              </Button>
            </div>
          </div>

          <Card className="glass-panel p-8 text-center md:p-10">
            <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No lectures yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Start creating your first lecture to see it here.
            </p>
            <div className="mt-5">
              <Button onClick={() => navigate('/generate')}>Create your first lecture</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
