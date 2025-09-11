import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MinecraftCityProps {
  className?: string;
  numBuildings?: number;
  maxHeight?: number;
  gridSize?: number;
}

interface Building {
  id: string;
  x: number;
  z: number;
  height: number;
  width: number;
  depth: number;
  color: string;
  isLit: boolean;
}

const MinecraftCity: React.FC<MinecraftCityProps> = ({
  className,
  numBuildings = 50,
  maxHeight = 8,
  gridSize = 20
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Colores estilo Minecraft
  const colors = [
    '#8B4513', // Brown (wood)
    '#696969', // DimGray (stone)
    '#2F4F4F', // DarkSlateGray (dark stone)
    '#8B0000', // DarkRed (brick)
    '#4682B4', // SteelBlue (metal)
    '#228B22', // ForestGreen (nature)
    '#D2691E', // Chocolate (wood variant)
    '#708090', // SlateGray (concrete)
    '#A0522D', // Sienna (brick variant)
    '#556B2F', // DarkOliveGreen (nature variant)
  ];

  // Generar edificios aleatorios
  const generateBuildings = useCallback(() => {
    const newBuildings: Building[] = [];
    const usedPositions = new Set<string>();

    for (let i = 0; i < numBuildings; i++) {
      let x, z;
      let positionKey;
      
      // Evitar superposición
      do {
        x = Math.floor(Math.random() * gridSize) - gridSize / 2;
        z = Math.floor(Math.random() * gridSize) - gridSize / 2;
        positionKey = `${x},${z}`;
      } while (usedPositions.has(positionKey));

      usedPositions.add(positionKey);

      const height = Math.floor(Math.random() * maxHeight) + 1;
      const width = Math.random() > 0.7 ? 2 : 1; // 30% chance de edificio más ancho
      const depth = Math.random() > 0.7 ? 2 : 1; // 30% chance de edificio más profundo
      const color = colors[Math.floor(Math.random() * colors.length)];

      newBuildings.push({
        id: `building-${i}`,
        x,
        z,
        height,
        width,
        depth,
        color,
        isLit: false
      });
    }

    setBuildings(newBuildings);
  }, [numBuildings, maxHeight, gridSize, colors]);

  // Manejar movimiento del mouse
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    setMousePosition({ x, y });

    // Iluminar edificios cercanos al mouse
    setBuildings(prevBuildings => 
      prevBuildings.map(building => {
        const buildingX = (building.x + gridSize / 2) / gridSize;
        const buildingZ = (building.z + gridSize / 2) / gridSize;
        
        const distance = Math.sqrt(
          Math.pow(x - buildingX, 2) + Math.pow(y - buildingZ, 2)
        );
        
        return {
          ...building,
          isLit: distance < 0.15 // Radio de iluminación
        };
      })
    );
  }, [gridSize]);

  useEffect(() => {
    generateBuildings();
  }, [generateBuildings]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 overflow-hidden",
        "transform-gpu perspective-1000",
        className
      )}
      style={{
        transform: 'perspective(1000px) rotateX(60deg) rotateY(-15deg)',
        transformOrigin: 'center center'
      }}
    >
      {/* Suelo de la ciudad */}
      <div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-32 bg-gradient-to-t from-gray-800 to-gray-600"
        style={{
          transform: 'translateX(-50%) translateZ(-10px)',
          transformOrigin: 'center bottom'
        }}
      />
      
      {/* Edificios */}
      {buildings.map((building) => (
        <motion.div
          key={building.id}
          className="absolute"
          style={{
            left: '50%',
            bottom: '8rem',
            transform: `translateX(-50%) translateX(${building.x * 20}px) translateZ(${building.z * 20}px)`,
            transformOrigin: 'center bottom'
          }}
          animate={{
            scale: building.isLit ? 1.05 : 1,
            filter: building.isLit 
              ? 'brightness(1.3) drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))' 
              : 'brightness(1)'
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Cubo del edificio */}
          <div
            className="relative"
            style={{
              width: `${building.width * 20}px`,
              height: `${building.height * 20}px`,
              backgroundColor: building.color,
              transform: 'translateZ(0)',
              boxShadow: building.isLit 
                ? '0 0 20px rgba(255, 255, 255, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)' 
                : '0 4px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Cara frontal */}
            <div 
              className="absolute inset-0 border border-gray-800"
              style={{
                backgroundColor: building.color,
                transform: 'translateZ(10px)'
              }}
            />
            
            {/* Cara superior */}
            <div 
              className="absolute top-0 left-0 border border-gray-800"
              style={{
                width: `${building.width * 20}px`,
                height: `${building.depth * 20}px`,
                backgroundColor: building.color,
                transform: 'rotateX(90deg) translateZ(10px)',
                transformOrigin: 'top'
              }}
            />
            
            {/* Cara derecha */}
            <div 
              className="absolute top-0 right-0 border border-gray-800"
              style={{
                width: `${building.depth * 20}px`,
                height: `${building.height * 20}px`,
                backgroundColor: building.color,
                transform: 'rotateY(90deg) translateZ(10px)',
                transformOrigin: 'left'
              }}
            />
            
            {/* Ventanas iluminadas */}
            {building.isLit && (
              <>
                {Array.from({ length: Math.floor(building.height / 2) }).map((_, floor) => (
                  Array.from({ length: Math.floor(building.width) }).map((_, window) => (
                    <motion.div
                      key={`window-${floor}-${window}`}
                      className="absolute bg-yellow-300"
                      style={{
                        width: '4px',
                        height: '6px',
                        left: `${8 + window * 8}px`,
                        top: `${8 + floor * 20}px`,
                        transform: 'translateZ(11px)',
                        boxShadow: '0 0 8px rgba(255, 255, 0, 0.8)'
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: floor * 0.1 + window * 0.05 }}
                    />
                  ))
                ))}
              </>
            )}
          </div>
        </motion.div>
      ))}
      
      {/* Efecto de niebla atmosférica */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.3) 100%)',
          transform: 'translateZ(50px)'
        }}
      />
    </div>
  );
};

export default MinecraftCity;
