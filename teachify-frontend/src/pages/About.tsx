import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Target, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-10 md:py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12 md:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm mb-3">
            <GraduationCap className="h-3 w-3 text-primary" />
            <span>About Teachify</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold mb-4">
            About Teachify
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            We&apos;re on a mission to democratize education through AI-powered
            content creation — helping educators turn ideas into lecture videos
            in minutes.
          </p>
        </div>

        {/* Story / intro */}
        <Card className="glass-panel mb-10 md:mb-12 p-6 md:p-8">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Teachify combines cutting-edge artificial intelligence with proven
            educational principles to help educators, trainers, and content
            creators produce high-quality lecture videos in minutes, not hours.
            Our platform handles the heavy lifting — from content structuring to
            visual generation to professional narration — so you can focus on
            what matters: teaching effectively.
          </p>
        </Card>

        {/* Grid of values */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="glass-panel p-6 md:p-7">
            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              To empower educators worldwide with AI tools that make creating
              engaging, professional educational content accessible to everyone.
            </p>
          </Card>

          <Card className="glass-panel p-6 md:p-7">
            <div className="bg-secondary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Our Technology</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              We leverage state-of-the-art language models, computer vision, and
              speech synthesis to deliver lectures that rival professionally
              produced content.
            </p>
          </Card>

          <Card className="glass-panel p-6 md:p-7">
            <div className="bg-success/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Our Community</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Join educators, trainers, and content creators who trust Teachify
              to help them reach more learners with better content.
            </p>
          </Card>

          <Card className="glass-panel p-6 md:p-7">
            <div className="bg-warning/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <GraduationCap className="h-6 w-6 text-warning" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Our Commitment</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              We&apos;re committed to continuous improvement, listening to our
              users, and ensuring that education remains at the heart of
              everything we build.
            </p>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-3">
            Ready to get started?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-xl mx-auto">
            Join our community and start creating better educational content
            today — powered by AI and designed for modern learners.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/signup')}
          >
            Start creating with Teachify
          </Button>
        </div>
      </div>
    </div>
  );
};

export default About;
