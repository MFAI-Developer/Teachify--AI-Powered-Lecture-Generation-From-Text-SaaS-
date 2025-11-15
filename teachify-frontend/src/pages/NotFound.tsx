import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4">
        <Card className="glass-panel max-w-md mx-auto p-8 md:p-10 text-center">
          <h1 className="mb-2 text-5xl md:text-6xl font-semibold tracking-tight">
            404
          </h1>
          <p className="mb-2 text-base md:text-lg text-muted-foreground">
            Oops! The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <p className="mb-6 text-xs md:text-sm text-muted-foreground">
            It might have been moved, renamed, or never existed.
          </p>
          <Button onClick={() => navigate("/")}>
            Return to Home
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
