import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentApi, LectureOutput } from '@/api/content';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FileText, Loader2, Upload, X } from 'lucide-react';

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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FileText className="h-8 w-8 text-secondary" />
            Generate from Documents
          </h1>
          <p className="text-muted-foreground">
            Upload your PDFs, Word docs, or text files to create grounded lecture content.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <Label htmlFor="prompt">What should the lecture focus on?</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Create a lecture explaining the key concepts from these research papers"
                className="min-h-[120px] mt-2"
                disabled={isGenerating}
                required
              />
            </div>

            <div>
              <Label>Upload Documents (PDF, DOCX, TXT)</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center w-full h-32 px-4 transition bg-muted border-2 border-dashed border-border rounded-2xl hover:bg-muted/80 cursor-pointer">
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

export default GenerateDocs;
