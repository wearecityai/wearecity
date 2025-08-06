import React from 'react';
import { Loader2 } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 w-screen h-screen bg-background flex items-center justify-center z-[2000]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
};

export default SplashScreen;