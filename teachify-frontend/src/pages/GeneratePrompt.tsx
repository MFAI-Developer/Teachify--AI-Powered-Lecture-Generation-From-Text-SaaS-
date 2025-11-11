import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentApi, LectureOutput } from '@/api/content';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Sparkles, Loader2 } from 'lucide-react';

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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Generate from Prompt
          </h1>
          <p className="text-muted-foreground">
            Describe any topic and let AI create a complete lecture video for you.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <Label htmlFor="prompt">Lecture Topic or Question</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Explain the basics of quantum computing for beginners"
                className="min-h-[150px] mt-2"
                disabled={isGenerating}
                required
              />
              <p className="text-sm text-muted-foreground mt-2">
                Be specific about what you want to cover. Include target audience if relevant.
              </p>
            </div>

            <Button type="submit" size="lg" disabled={isGenerating} className="w-full">
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

        {/* Result Display */}
        {result && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">{result.topic}</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Introduction</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{result.introduction}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Main Content</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{result.main_body}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Conclusion</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{result.conclusion}</p>
              </div>

              {result.visualizations && result.visualizations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Visual Elements</h3>
                  <div className="space-y-3">
                    {result.visualizations.map((viz, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">{viz.section}</p>
                        <p className="text-sm text-muted-foreground">{viz.prompt}</p>
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
                  <h3 className="font-semibold text-lg mb-2">Generated Video</h3>
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
