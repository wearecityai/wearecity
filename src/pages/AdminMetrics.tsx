import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminMetrics: React.FC = () => {
  const { user, profile, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (profile?.role !== 'administrativo') return <Navigate to="/" replace />;

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('metrics.title', { defaultValue: 'Metrics' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('metrics.comingSoon', { defaultValue: 'Metrics dashboard coming soon.' })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMetrics;


