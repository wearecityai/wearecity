"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Building2, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Hero223Props {
  badge?: string;
  title1?: string;
  title2?: string;
  description?: string;
  className?: string;
}

export function Hero223({
  badge = "WeAreCity",
  title1 = "Transforma Tu",
  title2 = "Experiencia Ciudadana",
  description = "Conecta con tu ciudad de manera inteligente. Accede a servicios municipales, información local y asistencia personalizada con tecnología de vanguardia.",
  className,
}: Hero223Props) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: 0.2 + i * 0.1,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    }),
  };

  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    },
  };

  return (
    <div className={cn("relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background", className)}>
      {/* City Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-12 gap-1 h-full">
          {/* Row 1 */}
          <div className="bg-muted-foreground/20 h-8"></div>
          <div className="bg-muted-foreground/15 h-12"></div>
          <div className="bg-muted-foreground/25 h-6"></div>
          <div className="bg-muted-foreground/20 h-16"></div>
          <div className="bg-muted-foreground/30 h-10"></div>
          <div className="bg-muted-foreground/10 h-20"></div>
          <div className="bg-muted-foreground/25 h-8"></div>
          <div className="bg-muted-foreground/35 h-14"></div>
          <div className="bg-muted-foreground/15 h-12"></div>
          <div className="bg-muted-foreground/30 h-6"></div>
          <div className="bg-muted-foreground/20 h-18"></div>
          <div className="bg-muted-foreground/25 h-10"></div>
          
          {/* Row 2 */}
          <div className="bg-muted-foreground/20 h-14"></div>
          <div className="bg-muted-foreground/30 h-8"></div>
          <div className="bg-muted-foreground/15 h-22"></div>
          <div className="bg-muted-foreground/25 h-6"></div>
          <div className="bg-muted-foreground/35 h-16"></div>
          <div className="bg-muted-foreground/10 h-12"></div>
          <div className="bg-muted-foreground/20 h-18"></div>
          <div className="bg-muted-foreground/30 h-10"></div>
          <div className="bg-muted-foreground/15 h-8"></div>
          <div className="bg-muted-foreground/40 h-14"></div>
          <div className="bg-muted-foreground/25 h-6"></div>
          <div className="bg-muted-foreground/20 h-20"></div>
          
          {/* Row 3 */}
          <div className="bg-muted-foreground/35 h-10"></div>
          <div className="bg-muted-foreground/15 h-16"></div>
          <div className="bg-muted-foreground/30 h-8"></div>
          <div className="bg-muted-foreground/20 h-12"></div>
          <div className="bg-muted-foreground/10 h-24"></div>
          <div className="bg-muted-foreground/25 h-6"></div>
          <div className="bg-muted-foreground/40 h-14"></div>
          <div className="bg-muted-foreground/15 h-10"></div>
          <div className="bg-muted-foreground/30 h-18"></div>
          <div className="bg-muted-foreground/20 h-8"></div>
          <div className="bg-muted-foreground/35 h-12"></div>
          <div className="bg-muted-foreground/10 h-16"></div>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {badge}
            </span>
          </motion.div>

          {/* Title */}
          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                {title1}
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-secondary">
                {title2}
              </span>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mb-12"
          >
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {description}
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            variants={staggerVariants}
            initial="hidden"
            animate="visible"
            className="mb-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <motion.div variants={itemVariants} className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-sm">Servicios Municipales</h3>
                  <p className="text-xs text-muted-foreground">Acceso directo a trámites</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-sm">Comunidad Local</h3>
                  <p className="text-xs text-muted-foreground">Conecta con vecinos</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Zap className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-sm">IA Avanzada</h3>
                  <p className="text-xs text-muted-foreground">Asistencia inteligente</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export type { Hero223Props };
