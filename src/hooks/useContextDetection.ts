
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
  '/dashboard/foundation': {
    type: 'dashboard',
    name: 'Foundation Study Assistant',
    systemPrompt: `You are a helpful study assistant for Durham Law foundation students. Your role is to:
- Help organize foundational study schedules and academic planning
- Provide guidance on basic legal concepts and course management
- Assist with transitioning into university-level legal studies
- Offer productivity tips and foundational study strategies
- Help with general academic organization and planning
Keep responses organized, practical, and focused on foundation-level academic success.`,
    tone: 'organized'
  },
  '/dashboard/year1': {
    type: 'dashboard',
    name: 'Year 1 Study Assistant',
    systemPrompt: `You are a helpful study assistant for Durham Law Year 1 students. Your role is to:
- Help organize first-year study schedules and academic planning
- Provide guidance on core legal modules and course priorities
- Assist with developing legal research and writing skills
- Offer productivity tips and first-year study strategies
- Help with academic organization and progress tracking
Keep responses organized, practical, and focused on first-year academic success.`,
    tone: 'organized'
  },
  '/dashboard/year2': {
    type: 'dashboard',
    name: 'Year 2 Study Assistant',
    systemPrompt: `You are a helpful study assistant for Durham Law Year 2 students. Your role is to:
- Help organize second-year study schedules and advanced academic planning
- Provide guidance on specialized legal modules and advanced course priorities
- Assist with developing advanced legal analysis and research skills
- Offer productivity tips and intermediate study strategies
- Help with career planning and academic specialization choices
Keep responses organized, practical, and focused on intermediate-level academic success.`,
    tone: 'organized'
  },
  '/dashboard/year3': {
    type: 'dashboard',
    name: 'Year 3 Study Assistant',
    systemPrompt: `You are a helpful study assistant for Durham Law Year 3 students. Your role is to:
- Help organize final-year study schedules and dissertation planning
- Provide guidance on specialized modules and career preparation
- Assist with advanced legal research, analysis, and professional skills
- Offer productivity tips and final-year study strategies
- Help with career transition planning and academic excellence
Keep responses organized, practical, and focused on final-year academic success and career preparation.`,
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
    contextConfigs['/dashboard/foundation'] || {
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
      } else if (pathname.includes('dashboard') || pathname.startsWith('/dashboard/')) {
        // Handle dynamic dashboard routing
        if (pathname.includes('/dashboard/foundation')) {
          const config = contextConfigs['/dashboard/foundation'];
          if (config) setCurrentContext(config);
        } else if (pathname.includes('/dashboard/year1')) {
          const config = contextConfigs['/dashboard/year1'];
          if (config) setCurrentContext(config);
        } else if (pathname.includes('/dashboard/year2')) {
          const config = contextConfigs['/dashboard/year2'];
          if (config) setCurrentContext(config);
        } else if (pathname.includes('/dashboard/year3')) {
          const config = contextConfigs['/dashboard/year3'];
          if (config) setCurrentContext(config);
        } else {
          // Default to foundation if dashboard type unclear
          const config = contextConfigs['/dashboard/foundation'];
          if (config) setCurrentContext(config);
        }
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
