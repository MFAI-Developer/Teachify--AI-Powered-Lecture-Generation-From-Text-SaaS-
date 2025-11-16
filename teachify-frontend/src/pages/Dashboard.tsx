import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, FileText, Clock, Activity, Film } from 'lucide-react';
import { contentApi, LectureHistoryItem } from '@/api/content';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [recentLectures, setRecentLectures] = useState<LectureHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRecent = async () => {
      setIsLoadingHistory(true);
      setHistoryError(null);
      try {
        const data = await contentApi.getLectureHistory(3);
        if (isMounted) {
          setRecentLectures(data);
        }
      } catch (err) {
        if (isMounted) {
          setHistoryError('Unable to load recent lectures.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    fetchRecent();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlayLecture = (item: LectureHistoryItem) => {
    navigate('/player', { state: { lecture: item.lecture } });
  };

  const hasRecentLectures = !isLoadingHistory && !historyError && recentLectures.length > 0;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-8 md:py-10 lg:py-12">
        {/* Welcome Banner */}
        <div className="mb-10 animate-soft-fade">
          <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-6 py-7 text-primary-foreground shadow-[0_22px_55px_rgba(15,23,42,0.45)] md:px-8 md:py-8 lg:px-10 lg:py-9 shimmer-border">
            <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-soft-light bg-[radial-gradient(circle_at_0_0,rgba(255,255,255,0.35),transparent_55%),radial-gradient(circle_at_100%_0,rgba(59,130,246,0.8),transparent_55%),radial-gradient(circle_at_0_100%,rgba(129,140,248,0.85),transparent_55%)]" />
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
                <div className="inline-flex items-center gap-2 font-medium text-sky-50">
                  <Sparkles className="h-4 w-4" />
                  <span>Teachify is in beta</span>
                </div>
                <p className="text-sky-50/90">
                  We&apos;re continuously improving lecture quality, visuals, and avatars.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-10 grid gap-4 md:grid-cols-2 animate-soft-fade">
          <Card
            className="glass-panel group cursor-pointer border-primary/30 bg-gradient-to-br from-background via-background to-primary/5 p-6 hover:border-primary/60 hover:shadow-lg"
            onClick={() => navigate('/generate')}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3 w-3" />
                  <span>From a topic or idea</span>
                </div>
                <h2 className="mt-3 text-lg font-semibold">Generate from prompt</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Describe your topic in natural language and let Teachify build a full lecture outline with visuals.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card
            className="glass-panel group cursor-pointer border-primary/30 bg-gradient-to-br from-background via-background to-primary/5 p-6 hover:border-primary/60 hover:shadow-lg"
            onClick={() => navigate('/generate-docs')}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  <FileText className="h-3 w-3" />
                  <span>From your materials</span>
                </div>
                <h2 className="mt-3 text-lg font-semibold">Generate from documents</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload PDFs or notes and get a lecture grounded in your own content using RAG.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Film className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Activity & recent lectures */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,_1.4fr)_minmax(0,_1fr)]">
          {/* Recent lectures */}
          <Card className="glass-panel p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Lecture activity
                </p>
                <h2 className="mt-1 text-lg font-semibold">Recent lectures</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
                View all
              </Button>
            </div>

            {isLoadingHistory && (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-border/70 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium">Loading recent lectures…</p>
                  <p className="text-[11px]">Fetching your latest activity from the server.</p>
                </div>
                <Clock className="h-4 w-4 animate-pulse" />
              </div>
            )}

            {historyError && !isLoadingHistory && (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-xs">
                <div>
                  <p className="font-medium text-destructive">Couldn&apos;t load history</p>
                  <p className="text-[11px] text-destructive/80">{historyError}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => navigate('/history')}
                >
                  Open history
                </Button>
              </div>
            )}

            {hasRecentLectures && (
              <div className="mt-3 space-y-3">
                {recentLectures.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-xs hover:border-primary/50 hover:bg-primary/5 transition"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-tight">
                        {item.topic || item.lecture.topic}
                      </p>
                      <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(item.created_at).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                        <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                          {item.status === 'ready' ? 'Ready' : item.status}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px]"
                        onClick={() => handlePlayLecture(item)}
                      >
                        Play
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!hasRecentLectures && !isLoadingHistory && !historyError && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/40 px-4 py-6 text-center text-xs text-muted-foreground">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-sm">
                  <Clock className="h-4 w-4" />
                </div>
                <p className="font-medium">No lectures yet</p>
                <p className="mt-1 text-[11px]">
                  Generate your first lecture and you&apos;ll see it here.
                </p>
                <Button
                  size="sm"
                  className="mt-3 text-[11px]"
                  onClick={() => navigate('/generate')}
                >
                  Create your first lecture
                </Button>
              </div>
            )}
          </Card>

          {/* Right column: system status / tips */}
          <Card className="glass-panel flex flex-col justify-between gap-4 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pipeline overview
                </p>
                <h2 className="text-lg font-semibold">How your lecture is built</h2>
                <p className="text-sm text-muted-foreground">
                  Teachify uses Gemini for content, a visual model for images, a custom TTS voice and Azure
                  Avatar to assemble a complete lecture video for you.
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3 py-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  Content generation
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                  Powered by Gemini
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3 py-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Film className="h-3 w-3" />
                  Avatar &amp; voice
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                  Azure Avatar
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3 py-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Document grounding
                </span>
                <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-500">
                  RAG indexing
                </span>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-muted-foreground">
              Tip: you can always come back to the{' '}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-primary"
                onClick={() => navigate('/history')}
              >
                History
              </button>{' '}
              page to replay any lecture without regenerating it.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
