import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, FileText, Clock } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary to-primary-hover rounded-2xl p-8 mb-8 text-primary-foreground">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-lg opacity-90">
            Ready to create your next lecture?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 hover:shadow-lg transition-smooth cursor-pointer" onClick={() => navigate('/generate')}>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Generate from Prompt</h3>
                  <p className="text-muted-foreground mb-4">
                    Describe any topic and let AI create a complete lecture video for you.
                  </p>
                  <Button>Start Generating</Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-smooth cursor-pointer" onClick={() => navigate('/generate-docs')}>
              <div className="flex items-start gap-4">
                <div className="bg-secondary/10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Generate from Documents</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your PDFs, docs, or text files to create grounded lecture content.
                  </p>
                  <Button variant="secondary">Upload Documents</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Lectures */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Lectures</h2>
            <Button variant="outline" onClick={() => navigate('/history')}>
              View All
            </Button>
          </div>
          
          <Card className="p-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No lectures yet</h3>
            <p className="text-muted-foreground mb-4">
              Start creating your first lecture to see it here.
            </p>
            <Button onClick={() => navigate('/generate')}>
              Create Your First Lecture
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
