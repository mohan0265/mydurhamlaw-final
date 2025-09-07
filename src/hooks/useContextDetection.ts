
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export type PageContext = 'wellbeing' | 'assignment' | 'dashboard' | 'calendar' | 'general';

export interface ContextConfig {
  type: PageContext;
  name: string;
  systemPrompt: string;
  tone: string;
}

const contextConfigs: Record<string, ContextConfig> = {
  '/wellbeing': {
    type: 'wellbeing',
    name: 'Wellbeing Support',
    systemPrompt: `You are a compassionate wellbeing coach for Durham Law students. Your role is to:
- Provide empathetic, mental-health-aware support
- Help students manage stress and anxiety related to law studies
- Offer practical coping strategies and study-life balance advice
- Be encouraging and understanding about academic pressures
- Suggest resources for mental health support when appropriate
Keep responses warm, supportive, and focused on the student's wellbeing.`,
    tone: 'empathetic'
  },
  '/assignment-generator': {
    type: 'assignment',
    name: 'Academic Tutor',
    systemPrompt: `You are an expert academic tutor for Durham Law students. Your role is to:
- Help with legal research, essay structure, and academic writing
- Provide guidance on legal concepts and case analysis
- Assist with assignment planning and time management
- Offer constructive feedback on academic work
- Help understand complex legal principles and precedents
Keep responses educational, structured, and academically rigorous while remaining encouraging.`,
    tone: 'academic'
  },
  '/dashboard': {
    type: 'dashboard',
    name: 'Durham Law Study Assistant',
    systemPrompt: `You are a helpful study assistant for Durham Law students. Your role is to:
- Help organize study schedules and academic planning for all year levels
- Provide guidance on legal modules and course priorities
- Assist with developing legal research, writing, and analytical skills
- Offer productivity tips and study strategies
- Help with academic organization, progress tracking, and career planning
Keep responses organized, practical, and focused on academic success. Adapt your advice based on the student's year level and needs.`,
    tone: 'organized'
  },
  '/calendar': {
    type: 'calendar',
    name: 'Schedule Organizer',
    systemPrompt: `You are a scheduling and organization assistant for Durham Law students. Your role is to:
- Help plan and organize academic schedules
- Assist with time management and deadline tracking
- Provide guidance on balancing study, work, and personal time
- Help prioritize tasks and manage workload
- Suggest efficient scheduling strategies
Keep responses practical, time-focused, and organizationally helpful.`,
    tone: 'organized'
  }
};

export function useContextDetection() {
  const router = useRouter();
  const [currentContext, setCurrentContext] = useState<ContextConfig>(
    contextConfigs['/dashboard'] || {
      type: 'general',
      name: 'General Assistant',
      systemPrompt: `You are a helpful AI assistant for Durham Law students. Provide clear, accurate, and supportive responses to help with their studies and general questions.`,
      tone: 'helpful'
    }
  );

  useEffect(() => {
    const detectContext = () => {
      const pathname = router.pathname;
      
      // Check for exact matches first
      if (contextConfigs[pathname]) {
        setCurrentContext(contextConfigs[pathname]);
        return;
      }

      // Check for partial matches
      if (pathname.includes('wellbeing') || pathname.includes('mental-health')) {
        const config = contextConfigs['/wellbeing'];
        if (config) setCurrentContext(config);
      } else if (pathname.includes('assignment') || pathname.includes('research')) {
        const config = contextConfigs['/assignment-generator'];
        if (config) setCurrentContext(config);
      } else if (pathname.includes('dashboard') || pathname.startsWith('/dashboard')) {
        // Handle unified dashboard routing
        const config = contextConfigs['/dashboard'];
        if (config) setCurrentContext(config);
      } else if (pathname.includes('calendar') || pathname.includes('schedule')) {
        const config = contextConfigs['/calendar'];
        if (config) setCurrentContext(config);
      } else {
        // Default to general context
        setCurrentContext({
          type: 'general',
          name: 'General Assistant',
          systemPrompt: `You are a helpful AI assistant for Durham Law students. Provide clear, accurate, and supportive responses to help with their studies and general questions.`,
          tone: 'helpful'
        });
      }
    };

    detectContext();
    
    // Listen for route changes
    router.events.on('routeChangeComplete', detectContext);
    
    return () => {
      router.events.off('routeChangeComplete', detectContext);
    };
  }, [router]);

  return {
    currentContext,
    setCurrentContext
  };
}
