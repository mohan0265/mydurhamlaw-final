"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useSupabaseClient, useUser } from "@/lib/supabase/AuthContext";

interface CoffeeRSVP {
  id?: string;
  user_id?: string;
  display_name: string;
  event_date: string;
  created_at?: string;
}

const VirtualCoffeeTable: React.FC = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [rsvps, setRsvps] = useState<CoffeeRSVP[]>([]);
  const [hasRSVPed, setHasRSVPed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!supabase) {
    return (
      <div className="bg-gradient-to-br from-yellow-100 via-orange-100 to-amber-100 rounded-2xl shadow px-4 py-3 mb-4">
        <h3 className="font-bold text-lg mb-1">☕ Virtual Coffee Table</h3>
        <div className="text-sm text-red-600">Unable to load coffee table (no backend connection).</div>
      </div>
    );
  }

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Fetch RSVPs for today
  useEffect(() => {
    fetchTodayRSVPs();
    
    // Set up real-time subscription
    const channel = supabase.channel('lounge-coffee-rsvp');
    
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lounge_coffee_rsvp'
        },
        (payload: any) => {
          console.log('Coffee RSVP change received:', payload);
          fetchTodayRSVPs(); // Refresh the list
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);

  const fetchTodayRSVPs = async () => {
    try {
      const todayDate = getTodayDate();
      const { data, error } = await supabase
        .from('lounge_coffee_rsvp')
        .select('*')
        .eq('event_date', todayDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coffee RSVPs:', error);
        return;
      }

      setRsvps(data || []);
      
      // Check if current user has already RSVPed
      const userHasRSVPed = (data || []).some((rsvp: any) => 
        rsvp.user_id === user?.id
      );
      setHasRSVPed(userHasRSVPed);
    } catch (error) {
      console.error('Error fetching coffee RSVPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    if (hasRSVPed || submitting) return;
    
    setSubmitting(true);
    try {
      const todayDate = getTodayDate();
      const { error } = await supabase
        .from('lounge_coffee_rsvp')
        .insert([
          {
            display_name: user?.user_metadata?.full_name || 'Anonymous',
            event_date: todayDate,
            user_id: user?.id || null
          }
        ]);

      if (error) {
        console.error('Error submitting RSVP:', error);
        return;
      }

      setHasRSVPed(true);
    } catch (error) {
      console.error('Error submitting RSVP:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Format the time for display
  const getCoffeeTimeDisplay = () => {
    const now = new Date();
    const coffeeTime = new Date();
    coffeeTime.setHours(17, 0, 0, 0); // 5:00 PM
    
    if (now.getTime() > coffeeTime.getTime()) {
      return "Tomorrow's Coffee: 5-5:20pm";
    }
    return "Today's Coffee: 5-5:20pm";
  };

  return (
    <div className="bg-gradient-to-br from-yellow-100 via-orange-100 to-amber-100 rounded-2xl shadow px-4 py-3 mb-4">
      <h3 className="font-bold text-lg mb-1">☕ Virtual Coffee Table</h3>
      <div className="text-sm mb-2">
        {getCoffeeTimeDisplay()} | Host: Any student
      </div>
      
      {loading ? (
        <div className="text-sm text-gray-500">Loading RSVPs...</div>
      ) : (
        <>
          <div className="text-sm mb-2">
            <strong>{rsvps.length}</strong> {rsvps.length === 1 ? 'person has' : 'people have'} RSVPed
            {rsvps.length > 0 && (
              <div className="text-xs text-gray-600 mt-1">
                {rsvps.slice(0, 3).map(rsvp => rsvp.display_name).join(', ')}
                {rsvps.length > 3 && ` and ${rsvps.length - 3} more`}
              </div>
            )}
          </div>
          
          <Button
            size="sm"
            className="mt-2"
            onClick={handleRSVP}
            disabled={hasRSVPed || submitting}
            aria-pressed={hasRSVPed}
          >
            {submitting ? 'Submitting...' : hasRSVPed ? 'Marked as Attending' : 'RSVP to Join'}
          </Button>
          
          {hasRSVPed && (
            <div className="text-xs text-green-600 mt-1 font-medium">
              ✓ See you at the table!
            </div>
          )}
        </>
      )}
      
      <div className="text-xs text-gray-400 mt-1">
        Make friends—zero pressure, all welcome.
      </div>
    </div>
  );
};

export default VirtualCoffeeTable;