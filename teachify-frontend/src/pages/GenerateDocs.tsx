import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentApi, LectureOutput } from '@/api/content';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FileText, Loader2, Upload, X, ShieldCheck } from 'lucide-react';

const GenerateDocs = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<LectureOutput | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (prompt.length < 10) {
      toast.error('Please enter a more detailed prompt (at least 10 characters)');
      return;
    }

    if (files.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const output = await contentApi.generateFromDocuments(prompt, files);
      setResult(output);
      toast.success('Lecture generated successfully from your documents!');
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
              <FileText className="h-3 w-3 text-secondary" />
              <span>Document-grounded lecture generation</span>
            </div>
            <h1 className="text-3xl font-semibold mb-1 flex items-center gap-3">
              <FileText className="h-8 w-8 text-secondary" />
              Generate from Documents
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl">
              Upload PDFs, Word docs, or text files and let AI generate a structured lecture that
              stays true to your source material.
            </p>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/80 bg-card/90 px-4 py-3 text-xs text-muted-foreground max-w-xs shadow-sm">
              <p className="font-medium text-foreground mb-1">Ideal use cases:</p>
              <p>
                Research papers, course notes, ebooks, training manuals, and internal documentation.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] text-muted-foreground shadow-sm">
              <span
                className={`inline-flex h-2 w-2 rounded-full ${
                  isGenerating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{isGenerating ? 'Processing documents with AI...' : 'Ready for upload'}</span>
            </div>
          </div>
        </div>

        {/* Layout: form + info */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)]">
          {/* Form card */}
          <Card className="glass-panel p-6 md:p-7 animate-rise">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <Label htmlFor="prompt">What should the lecture focus on?</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Create a lecture explaining the key concepts from these research papers for a third-year AI class."
                  className="min-h-[120px] mt-2"
                  disabled={isGenerating}
                  required
                />
              </div>

              <div>
                <Label>Upload documents (PDF, DOCX, TXT)</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 px-4 transition bg-muted/70 border-2 border-dashed border-border rounded-2xl hover:bg-muted/90 cursor-pointer">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={handleFileChange}
                      disabled={isGenerating}
                    />
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={isGenerating}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                variant="secondary"
                disabled={isGenerating || files.length === 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing documents...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-5 w-5" />
                    Generate Lecture from Documents
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Info / guidance panel */}
          <Card className="glass-panel p-6 md:p-7 animate-rise">
            <h2 className="text-base font-semibold mb-3">Tips for better document-based lectures</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="rounded-xl bg-muted/60 px-3 py-2">
                Combine related documents (e.g., multiple research papers on the same topic) for a
                richer lecture.
              </li>
              <li className="rounded-xl bg-muted/60 px-3 py-2">
                Use the prompt to tell the AI the{' '}
                <span className="font-semibold">target audience</span> and{' '}
                <span className="font-semibold">depth</span> you want.
              </li>
              <li className="rounded-xl bg-muted/60 px-3 py-2">
                For long PDFs, mention which chapters or sections matter most.
              </li>
            </ul>

            <div className="mt-5 border-t border-border/70 pt-4 text-xs text-muted-foreground space-y-2">
              <p className="font-medium text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Privacy & control
              </p>
              <p>
                Your files are used only to generate this lecture and follow your backend&apos;s
                existing security and storage rules.
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

export default GenerateDocs;
