import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface ChartAreaInteractiveProps {
  title?: string;
  description?: string;
  data?: Array<{
    name: string;
    value: number;
  }>;
}

export function ChartAreaInteractive({ 
  title = "Estadísticas de Actividad",
  description = "Actividad en la plataforma en los últimos 7 días",
  data = [
    { name: "Lun", value: 186 },
    { name: "Mar", value: 305 },
    { name: "Mié", value: 237 },
    { name: "Jue", value: 173 },
    { name: "Vie", value: 209 },
    { name: "Sáb", value: 114 },
    { name: "Dom", value: 156 }
  ]
}: ChartAreaInteractiveProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-end space-x-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="bg-primary/20 hover:bg-primary/30 rounded-t transition-colors cursor-pointer w-full"
                style={{
                  height: `${(item.value / maxValue) * 150}px`,
                  minHeight: '20px'
                }}
                title={`${item.name}: ${item.value}`}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center text-sm text-muted-foreground">
          <TrendingUp className="h-3 w-3 mr-1" />
          Trending up by 5.2% this month
        </div>
      </CardContent>
    </Card>
  );
}