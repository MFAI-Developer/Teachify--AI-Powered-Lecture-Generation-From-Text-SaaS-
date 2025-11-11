import { Card } from '@/components/ui/card';
import { GraduationCap, Target, Users, Zap } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Teachify</h1>
            <p className="text-xl text-muted-foreground">
              We're on a mission to democratize education through AI-powered content creation.
            </p>
          </div>

          <div className="prose prose-lg max-w-none mb-16">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Teachify combines cutting-edge artificial intelligence with proven educational principles
              to help educators, trainers, and content creators produce high-quality lecture videos in
              minutes, not hours. Our platform handles the heavy lifting—from content structuring to
              visual generation to professional narration—so you can focus on what matters: teaching
              effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <Card className="p-6">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
              <p className="text-muted-foreground">
                To empower educators worldwide with AI tools that make creating engaging, professional
                educational content accessible to everyone.
              </p>
            </Card>

            <Card className="p-6">
              <div className="bg-secondary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Our Technology</h3>
              <p className="text-muted-foreground">
                We leverage state-of-the-art language models, computer vision, and speech synthesis
                to deliver lectures that rival professionally produced content.
              </p>
            </Card>

            <Card className="p-6">
              <div className="bg-success/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Our Community</h3>
              <p className="text-muted-foreground">
                Join thousands of educators, trainers, and content creators who trust Teachify
                to help them reach more learners with better content.
              </p>
            </Card>

            <Card className="p-6">
              <div className="bg-warning/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Our Commitment</h3>
              <p className="text-muted-foreground">
                We're committed to continuous improvement, listening to our users, and ensuring
                that education remains at the heart of everything we build.
              </p>
            </Card>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-6">
              Join our community and start creating better educational content today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
