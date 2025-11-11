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
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Generate Lecture Videos from
            <span className="text-primary"> Any Topic</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your ideas and documents into professional lecture videos with AI-powered content generation, visuals, and avatar presentation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button size="lg" className="text-lg px-8" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button size="lg" className="text-lg px-8" onClick={() => navigate('/signup')}>
                  Get Started
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate('/login')}>
                  Try Demo
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-6 text-center hover:shadow-lg transition-smooth">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Enter Your Topic</h3>
              <p className="text-muted-foreground">
                Simply describe what you want to teach or upload your documents for grounded content.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-smooth">
              <div className="bg-secondary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. AI Generates Content</h3>
              <p className="text-muted-foreground">
                Our AI creates structured lecture content with engaging visuals and narration.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-smooth">
              <div className="bg-success/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Video className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Get Your Video</h3>
              <p className="text-muted-foreground">
                Receive a professional lecture video ready to share with your students.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose Teachify?</h2>
            <div className="space-y-6">
              {[
                'Save hours creating educational content',
                'Professional quality videos with AI avatars',
                'Generate from any topic or your own documents',
                'Consistent, engaging presentations every time',
                'Perfect for educators, trainers, and content creators',
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                  <p className="text-lg text-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join educators worldwide who are creating better content faster with Teachify.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => navigate('/signup')}>
            Start Creating Today
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
