import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout, LayoutMain, LayoutContainer } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeft, Home, Search } from "lucide-react";

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
    <Layout>
      <LayoutMain className="flex items-center justify-center">
        <LayoutContainer>
          <div className="max-w-md mx-auto">
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="Página no encontrada"
              description={`La página "${location.pathname}" no existe o ha sido movida.`}
              action={{
                label: "Volver al inicio",
                onClick: () => navigate('/'),
                variant: "default"
              }}
            />
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver atrás
              </Button>
            </div>
          </div>
        </LayoutContainer>
      </LayoutMain>
    </Layout>
  );
};

export default NotFound;
