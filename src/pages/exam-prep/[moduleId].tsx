'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/lib/supabase/AuthContext';
import ModernSidebar from '@/components/layout/ModernSidebar';
import BackToHomeButton from '@/components/ui/BackToHomeButton';
import DurmahChat from '@/components/durmah/DurmahChat';
import { Play, FileText, Mic, BookOpen, Clock, ArrowLeft, Archive, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Tabs Components (Placeholders for now, or minimal impl)
const TabPlan = ({ generate, artifacts }: any) => (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="font-bold text-lg mb-4">Issue Map & Priorities</h3>
            <p className="text-gray-600 mb-4">Generate a structural map of legal issues based on your lectures.</p>
            <Button onClick={() => generate('issue_map')}>Generate Issue Map</Button>
        </div>
        <div>
            <h4 className="font-bold text-gray-700 mb-2">Saved Plans</h4>
            {artifacts.filter((a:any) => a.type === 'issue_map').map((a:any) => (
                 <div key={a.id} className="p-3 bg-gray-50 rounded mb-2 border">{a.title}</div>
            ))}
        </div>
    </div>
);

const TabPractice = ({ generate, artifacts }: any) => (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="font-bold text-lg mb-4">Problem Questions</h3>
            <Button onClick={() => generate('problem_questions')}>Generate Practice Question</Button>
        </div>
        <div>
             <h4 className="font-bold text-gray-700 mb-2">Saved Practice</h4>
             {artifacts.filter((a:any) => a.type === 'problem_questions').map((a:any) => (
                 <div key={a.id} className="p-3 bg-gray-50 rounded mb-2 border">{a.title}</div>
            ))}
        </div>
    </div>
);

const TabOral = ({ generate }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 text-center py-12">
        <Mic className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-bold text-lg">Mini Moot & Speak Law</h3>
        <p className="text-gray-500 mb-4">Practice verbal argumentation.</p>
        <Button onClick={() => generate('mini_moot')}>Start Oral Session</Button>
    </div>
);

const TabArtifacts = ({ artifacts }: any) => (
    <div className="space-y-4">
        {artifacts.map((a:any) => (
            <div key={a.id} className="p-4 bg-white border rounded-lg shadow-sm flex justify-between">
                <span className="font-medium">{a.title}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded uppercase">{a.type}</span>
            </div>
        ))}
        {artifacts.length === 0 && <p className="text-gray-500 italic">No artifacts yet.</p>}
    </div>
);


export default function ExamWorkspacePage() {
    const router = useRouter();
    const { moduleId } = router.query;
    const { user } = useContext(AuthContext);
    
    // State
    const [workspace, setWorkspace] = useState<any>(null);
    const [artifacts, setArtifacts] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('plan'); // plan, practice, oral, artifacts
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load Workspace & State
    useEffect(() => {
        if (!moduleId || !user) return;

        // 1. Load Workspace
        // 2. Load State (Last Tab)
        // 3. Load Artifacts

        Promise.all([
             fetch(`/api/exam/workspaces`).then(r => r.json()).then(ws => ws.find((w:any) => w.module_id === moduleId)),
             fetch(`/api/exam/state?module_id=${moduleId}`).then(r => r.json()),
             // TODO: fetch artifacts specific endpoint or add to workspace
        ]).then(([ws, state]) => {
             if (ws) setWorkspace(ws);
             if (state?.last_tab) setActiveTab(state.last_tab);
             setLoading(false);
        });

    }, [moduleId, user]);

    // Save State on Tab Change
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        fetch('/api/exam/state', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ module_id: moduleId, last_tab: tab })
        });
    };

    const handleGenerate = async (type: string) => {
        // optimistically add placeholder?
        try {
            const res = await fetch('/api/exam/generate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    module_id: moduleId, 
                    workspace_id: workspace?.id, 
                    type 
                })
            });
            const newArtifact = await res.json();
            setArtifacts([newArtifact, ...artifacts]);
        } catch(e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading Workspace...</div>;
    if (!workspace) return <div className="p-12 text-center">Workspace not found (or locked).</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex">
             <ModernSidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
             
             <div className={`transition-all duration-300 flex-1 p-6 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} lg:ml-0 lg:pl-20`}> {/* Adjusted layout logic to fit sidebar */}
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/exam-prep')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{workspace.module.title}</h1>
                        <p className="text-sm text-gray-500">Exam Preparation Workspace</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
                    
                    {/* Main Workspace (Tabs) */}
                    <div className="lg:col-span-8 flex flex-col h-full">
                        {/* Tab Nav */}
                        <div className="flex items-center gap-2 mb-4 bg-white p-1 rounded-lg border w-fit">
                            {[
                                { id: 'plan', label: 'Plan', icon: BookOpen },
                                { id: 'practice', label: 'Practice', icon: FileText },
                                { id: 'oral', label: 'Oral', icon: Mic },
                                { id: 'artifacts', label: 'Artifacts', icon: Archive },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content Area */}
                        <div className="flex-1 overflow-y-auto pr-2">
                             {activeTab === 'plan' && <TabPlan generate={handleGenerate} artifacts={artifacts} />}
                             {activeTab === 'practice' && <TabPractice generate={handleGenerate} artifacts={artifacts} />}
                             {activeTab === 'oral' && <TabOral generate={handleGenerate} />}
                             {activeTab === 'artifacts' && <TabArtifacts artifacts={artifacts} />}
                        </div>
                    </div>

                    {/* Right Panel: Durmah Chat */}
                    <div className="lg:col-span-4 h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-3 border-b bg-indigo-50/50">
                            <h3 className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                Durmah (Context Aware)
                            </h3>
                        </div>
                        <div className="flex-1 overflow-hidden">
                             {/* Reusing DurmahChat - pass context props */}
                             <DurmahChat 
                                contextType="module_exam" // Custom type to prompt "grounded mode"
                                contextTitle={workspace.module.title}
                                systemHint={`You are assisting with exam revision for ${workspace.module.title}. Use ONLY the uploaded lectures and assignments.`}
                                className="h-full border-none shadow-none"
                             />
                        </div>
                    </div>

                </div>
             </div>
        </div>
    );
}
