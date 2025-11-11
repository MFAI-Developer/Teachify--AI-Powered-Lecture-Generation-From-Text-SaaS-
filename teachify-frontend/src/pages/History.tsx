import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Lecture History</h1>
          <p className="text-muted-foreground">
            View and manage your previously generated lectures.
          </p>
        </div>

        <Card className="p-12 text-center">
          <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-3">No lectures yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Your generated lectures will appear here. Start creating your first lecture to see it in your history.
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
