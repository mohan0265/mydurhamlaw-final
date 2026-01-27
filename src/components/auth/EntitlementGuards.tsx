import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/lib/supabase/AuthContext';
import { RefreshCw } from 'lucide-react';

interface EntitlementsState {
    hasDurhamAccess: boolean;
    hasLnatAccess: boolean;
    loading: boolean;
}

export function useEntitlements() {
    const user = useUser();
    const [state, setState] = useState<EntitlementsState>({
        hasDurhamAccess: false,
        hasLnatAccess: false,
        loading: true
    });

    useEffect(() => {
        if (!user) {
            setState(s => ({ ...s, loading: false }));
            return;
        }

        let isMounted = true;
        fetch('/api/entitlements/me')
            .then(res => {
               // Handle non-JSON responses (e.g. 401/406)
               if (!res.ok) {
                   if (res.status === 401) return { hasDurhamAccess: false, hasLnatAccess: false };
                   throw new Error(`Entitlements fetch failed: ${res.status}`);
               }
               return res.json();
            })
            .then(data => {
                if(isMounted) {
                    setState({
                        hasDurhamAccess: !!data.hasDurhamAccess,
                        hasLnatAccess: !!data.hasLnatAccess,
                        loading: false
                    });
                }
            })
            .catch(err => {
                console.error('Failed to fetch entitlements', err);
                if(isMounted) setState(s => ({ ...s, loading: false }));
            });
            
        return () => { isMounted = false; };
    }, [user]);

    return state;
}

export function RequireDurhamAccess({ children }: { children: React.ReactNode }) {
    const { hasDurhamAccess, loading } = useEntitlements();
    const router = useRouter();
    const user = useUser();

    useEffect(() => {
        if (!loading && user && !hasDurhamAccess) {
            // Check if they are LNAT user? If so, send to /lnat, else /eligibility
             fetch('/api/entitlements/me').then(r => r.json()).then(d => {
                 if (d.hasLnatAccess) {
                     router.replace('/lnat');
                 } else {
                     router.replace('/eligibility'); 
                 }
             });
        } else if (!loading && !user) {
             router.replace('/login');
        }
    }, [hasDurhamAccess, loading, router, user]);

    if (loading || !hasDurhamAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return <>{children}</>;
}

export function RequireLnatAccess({ children }: { children: React.ReactNode }) {
    const { hasLnatAccess, loading } = useEntitlements();
    const router = useRouter();
    const user = useUser();

    useEffect(() => {
        if (!loading && user && !hasLnatAccess) {
             router.replace('/lnat/signup');
        } else if (!loading && !user) {
             router.replace('/lnat/signup');
        }
    }, [hasLnatAccess, loading, router, user]);

    if (loading || !hasLnatAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return <>{children}</>;
}
