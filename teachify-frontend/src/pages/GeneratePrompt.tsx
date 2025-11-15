import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentApi, LectureOutput } from '@/api/content';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Sparkles, Loader2, BrainCircuit } from 'lucide-react';

const GeneratePrompt = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<LectureOutput | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (prompt.length < 10) {
      toast.error('Please enter a more detailed prompt (at least 10 characters)');
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const output = await contentApi.generateFromPrompt(prompt);
      setResult(output);
      toast.success('Lecture generated successfully!');
      // Jump into live player
      navigate('/player', { state: { lecture: output } });
    } catch (error: any) {
      console.error('Generation error:', error);
      const message = error?.response?.data?.detail || 'Failed to generate lecture';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-10 max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-soft-fade">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm mb-3">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Prompt-based lecture generator</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-1 flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-primary" />
              Generate from Prompt
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl">
              Describe any topic and let AI create a complete lecture structure, visuals, and avatar
              narration for you.
            </p>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/80 bg-card/90 px-4 py-3 text-xs text-muted-foreground max-w-xs shadow-sm">
              <p className="font-medium text-foreground mb-1">Best results:</p>
              <p>
                Mention <span className="font-semibold">audience level</span>,{' '}
                <span className="font-semibold">goal</span>, and{' '}
                <span className="font-semibold">duration</span> you’re targeting.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] text-muted-foreground shadow-sm">
              <span
                className={`inline-flex h-2 w-2 rounded-full ${
                  isGenerating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{isGenerating ? 'Model generating your lecture...' : 'Model idle'}</span>
            </div>
          </div>
        </div>

        {/* Layout: form + tips */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)]">
          {/* Form */}
          <Card className="glass-panel p-6 md:p-7 animate-rise">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <Label htmlFor="prompt">Lecture topic or question</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Explain the basics of machine learning for first-year CS students in under 20 minutes."
                  className="min-h-[150px] mt-2"
                  disabled={isGenerating}
                  required
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Be specific about what you want to cover. You can mention level (beginner,
                  intermediate), examples you want included, and tone.
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating your lecture...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Lecture
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Right-side info panel (static UI only) */}
          <Card className="glass-panel p-6 md:p-7 animate-rise">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-primary" />
              Prompt examples
            </h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="rounded-xl bg-muted/60 px-3 py-2">
                “Create a 15-minute lecture introducing blockchain for business students with no
                technical background.”
              </li>
              <li className="rounded-xl bg-muted/60 px-3 py-2">
                “Explain gradient descent step-by-step for second-year AI students with visual
                intuition.”
              </li>
              <li className="rounded-xl bg-muted/60 px-3 py-2">
                “Teach the basics of time complexity with real-world analogies for first-year CS
                students.”
              </li>
            </ul>

            <div className="mt-5 border-t border-border/70 pt-4 text-xs text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Tip: You can refine later</p>
              <p>
                After generating, you can regenerate the lecture with a more focused prompt to adjust
                difficulty, depth, or examples.
              </p>
            </div>
          </Card>
        </div>

        {/* Result Display */}
        {result && (
          <Card className="glass-panel mt-8 p-6 md:p-7 animate-soft-fade">
            <h2 className="text-2xl font-semibold mb-4">{result.topic}</h2>

            <div className="space-y-6 text-sm md:text-base">
              <div>
                <h3 className="font-semibold text-lg mb-2">Introduction</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {result.introduction}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Main content</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {result.main_body}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Conclusion</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {result.conclusion}
                </p>
              </div>

              {result.visualizations && result.visualizations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Visual elements</h3>
                  <div className="space-y-3">
                    {result.visualizations.map((viz, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-border/70 bg-muted/60 p-3"
                      >
                        <p className="text-sm font-medium capitalize">{viz.section}</p>
                        <p className="text-sm text-muted-foreground">
                          {viz.prompt}
                        </p>
                        {viz.image_path && (
                          <img
                            src={viz.image_path}
                            alt={viz.prompt}
                            className="mt-2 rounded-lg max-w-full"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.video_path && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Generated video</h3>
                  <div className="bg-muted rounded-lg p-4">
                    <a
                      href={result.video_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {result.video_path}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GeneratePrompt;
