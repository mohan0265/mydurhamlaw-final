import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/lib/supabase/AuthContext';
import GlobalHeader from '@/components/GlobalHeader';
import { Plus, Trash2, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface InviteRow {
    email: string;
    name: string;
    status?: 'pending' | 'invited' | 'already_invited' | 'invalid_domain' | 'error' | 'self_referral_blocked';
}

interface ReferralLog {
    referred_email: string;
    status: string;
    invited_at: string;
}

export default function ReferPage() {
    const { user } = useAuth();
    const [invites, setInvites] = useState<InviteRow[]>([{ email: '', name: '' }]);
    const [logs, setLogs] = useState<ReferralLog[]>([]);
    const [sending, setSending] = useState(false);
    
    useEffect(() => {
        if (user) loadLogs();
    }, [user]);

    const loadLogs = async () => {
        try {
            const res = await fetch('/api/referrals/mine');
            if (res.ok) {
                const data = await res.json();
                setLogs(data.referrals || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const addRow = () => {
        if (invites.length < 10) {
            setInvites([...invites, { email: '', name: '' }]);
        } else {
            toast.error("Max 10 invites at a time.");
        }
    };

    const removeRow = (idx: number) => {
        setInvites(invites.filter((_, i) => i !== idx));
    };

    const updateRow = (idx: number, field: 'email' | 'name', val: string) => {
        const newRows = [...invites];
        if (!newRows[idx]) return;
        newRows[idx][field] = val;
        // Reset status on edit
        delete newRows[idx].status;
        setInvites(newRows);
    };

    const handleSend = async () => {
        // Filter empty
        const toSend = invites.filter(i => i.email.trim());
        if (toSend.length === 0) {
            toast.error("Please enter at least one email.");
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/referrals/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invites: toSend })
            });
            
            if (res.status === 429) {
                toast.error("Daily invite limit reached (10/day).");
                setSending(false);
                return;
            }

            const data = await res.json();
            
            if (data.results) {
                // Update rows with status
                const newRows = [...invites];
                let successCount = 0;
                
                data.results.forEach((r: any) => {
                    // Match back to row by email (simple)
                    const idx = newRows.findIndex(row => row.email.trim().toLowerCase() === r.email);
                    if (idx !== -1 && newRows[idx]) {
                        newRows[idx].status = r.status;
                        if (r.status === 'invited') successCount++;
                    }
                });
                
                setInvites(newRows);
                
                if (successCount > 0) {
                    toast.success(`Sent ${successCount} invites!`);
                    loadLogs();
                } else {
                    toast.error("No invites sent. Check statuses.");
                }
            }
        } catch (e) {
            toast.error("Failed to send invites.");
        } finally {
            setSending(false);
        }
    };

    const getStatusBadge = (status?: string) => {
        switch(status) {
            case 'invited': return <span className="text-green-600 flex items-center gap-1 text-sm"><CheckCircle className="w-4 h-4"/> Sent</span>;
            case 'already_invited': return <span className="text-orange-600 text-sm">Already invited</span>;
            case 'invalid_domain': return <span className="text-red-500 text-sm">Durham email only</span>;
            case 'self_referral_blocked': return <span className="text-red-500 text-sm">Cannot invite yourself</span>;
            case 'error': return <span className="text-red-500 text-sm">Error</span>;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head><title>Refer a Friend | MyDurhamLaw</title></Head>
            
            <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Invite Friends & Unlock Rewards</h1>
                    <p className="mt-2 text-lg text-gray-600">Give your friends a <strong>14-day Full Access Trial</strong>. Build your study circle.</p>
                </div>

                {/* INVITE CARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12">
                     <div className="p-6 border-b border-gray-100 bg-purple-50 flex justify-between items-center">
                         <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Mail className="w-5 h-5 text-purple-600"/> Send Invites
                            </h2>
                            <p className="text-sm text-purple-700 mt-1">Invite responsibly — Durham emails only (@durham.ac.uk).</p>
                         </div>
                         <span className="text-xs bg-white px-2 py-1 rounded border border-purple-200 text-purple-600 font-mono">
                            {invites.length}/10
                         </span>
                     </div>
                     
                     <div className="p-6">
                         <div className="space-y-3 mb-6">
                             {invites.map((row, i) => (
                                 <div key={i} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                     <div className="flex-1 w-full relative">
                                         <input 
                                            type="email" 
                                            placeholder="durham.email@durham.ac.uk" 
                                            value={row.email}
                                            onChange={e => updateRow(i, 'email', e.target.value)}
                                            className={`w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${row.status && row.status !== 'invited' ? 'border-red-300 bg-red-50' : ''}`}
                                         />
                                     </div>
                                     <div className="w-full sm:w-1/3">
                                         <input 
                                            type="text" 
                                            placeholder="Name (Optional)" 
                                            value={row.name}
                                            onChange={e => updateRow(i, 'name', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                                         />
                                     </div>
                                     <div className="min-w-[120px] pt-2 sm:pt-0">
                                         {getStatusBadge(row.status)}
                                     </div>
                                     {invites.length > 1 && (
                                         <button onClick={() => removeRow(i)} className="text-gray-400 hover:text-red-500 p-2">
                                             <Trash2 className="w-4 h-4" />
                                         </button>
                                     )}
                                 </div>
                             ))}
                         </div>
                         
                         <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                             <button onClick={addRow} className="text-sm font-medium text-gray-600 hover:text-purple-600 flex items-center gap-1">
                                 <Plus className="w-4 h-4" /> Add another
                             </button>
                             <button 
                                onClick={handleSend} 
                                disabled={sending}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 disabled:opacity-70 transition-all"
                             >
                                 {sending && <Loader2 className="w-4 h-4 animate-spin"/>}
                                 {sending ? 'Sending...' : 'Send Invites'}
                             </button>
                         </div>
                     </div>
                </div>

                {/* LOGS */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Your Referrals</h3>
                    {logs.length === 0 ? (
                        <p className="text-gray-500 italic text-sm">No referrals yet. Invite your first friend!</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-gray-500 border-b border-gray-100">
                                    <tr>
                                        <th className="pb-2 font-medium">Email</th>
                                        <th className="pb-2 font-medium">Status</th>
                                        <th className="pb-2 font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {logs.map((log, i) => (
                                        <tr key={i}>
                                            <td className="py-3 font-mono text-gray-700">{log.referred_email}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                                                    log.status === 'joined' ? 'bg-green-100 text-green-700' : 
                                                    log.status === 'reward_granted' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {log.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-3 text-gray-500">
                                                {new Date(log.invited_at).toLocaleDateString('en-GB', { timeZone: 'Europe/London' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
