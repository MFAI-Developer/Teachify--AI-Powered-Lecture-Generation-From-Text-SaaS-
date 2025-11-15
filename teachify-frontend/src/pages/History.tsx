import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, History as HistoryIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const navigate = useNavigate();

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
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-1">
              Lecture History
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl">
              View and manage lectures you&apos;ve generated. Once you start creating content,
              your recent lectures will appear here with quick access to replay and download.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/90 px-4 py-3 text-xs text-muted-foreground shadow-sm max-w-xs">
            <p className="font-medium text-foreground mb-1">How this works</p>
            <p>
              Every time you generate a new lecture from a prompt or documents, it will be listed
              here so you can come back to it anytime.
            </p>
          </div>
        </div>

        {/* Status strip */}
        <Card className="glass-panel mb-6 p-4 flex items-center justify-between text-xs md:text-sm animate-soft-fade">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-muted-foreground">
              No stored lectures yet. As soon as you generate, you&apos;ll see them in your history.
            </span>
          </div>
          <span className="hidden md:inline text-muted-foreground">
            History is tied to your current account.
          </span>
        </Card>

        {/* Empty state */}
        <Card className="glass-panel p-10 md:p-12 text-center transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_20px_45px_rgba(15,23,42,0.25)] animate-rise">
          <Clock className="h-14 w-14 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">
            No lectures yet
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md mx-auto">
            Once you generate your first AI-powered lecture, it will show up here so you can
            replay, review, and download it anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/generate')}>
              Generate from Prompt
            </Button>
            <Button variant="secondary" onClick={() => navigate('/generate-docs')}>
              Generate from Documents
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default History;
