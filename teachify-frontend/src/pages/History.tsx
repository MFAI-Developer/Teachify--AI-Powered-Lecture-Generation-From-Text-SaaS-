import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, History as HistoryIcon } from 'lucide-react';
import { contentApi, LectureHistoryItem } from '@/api/content';

const History = () => {
  const navigate = useNavigate();
  const [lectures, setLectures] = useState<LectureHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await contentApi.getLectureHistory();
        if (isMounted) {
          setLectures(data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load lecture history. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlayLecture = (item: LectureHistoryItem) => {
    navigate('/player', { state: { lecture: item.lecture } });
  };

  const hasLectures = !isLoading && !error && lectures.length > 0;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-10 max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between animate-soft-fade">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm mb-2">
              <HistoryIcon className="h-3 w-3 text-primary" />
              <span>Lecture history</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Your generated lectures
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Revisit and replay any lecture you&apos;ve generated with Teachify.
            </p>
          </div>
          <div className="mt-2 flex gap-2 md:mt-0">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
            <Button size="sm" onClick={() => navigate('/generate')}>
              New lecture
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <Card className="glass-panel flex items-center justify-between p-4 mb-4 animate-soft-fade">
            <div>
              <p className="text-sm font-medium">Loading your lectures...</p>
              <p className="text-xs text-muted-foreground">
                Fetching history from the server.
              </p>
            </div>
            <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
          </Card>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <Card className="glass-panel flex items-center justify-between p-4 mb-4 animate-soft-fade">
            <div>
              <p className="text-sm font-medium">Something went wrong</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Card>
        )}

        {/* History list */}
        {hasLectures && (
          <div className="space-y-4 animate-soft-fade">
            {lectures.map((item) => (
              <Card
                key={item.id}
                className="glass-panel flex flex-col items-start gap-3 p-4 md:flex-row md:items-center md:justify-between hover:shadow-lg hover:border-primary/50 transition"
              >
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold md:text-base">
                    {item.topic || item.lecture.topic}
                  </h2>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(item.created_at).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
                      {item.status === 'ready' ? 'Ready' : item.status}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handlePlayLecture(item)}
                  >
                    Play
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/generate', { state: { topic: item.lecture.topic } })}
                  >
                    Regenerate
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!hasLectures && !isLoading && !error && (
          <Card className="mt-4 glass-panel flex flex-col items-center justify-center gap-4 p-8 text-center animate-soft-fade">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">No lectures yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Once you start generating lectures, they&apos;ll appear here so you can replay them any time.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={() => navigate('/generate')}>Generate from Prompt</Button>
              <Button variant="secondary" onClick={() => navigate('/generate-docs')}>
                Generate from Documents
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default History;
