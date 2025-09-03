import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CoffeeRSVP {
  id?: string;
  user_id?: string;
  display_name: string;
  event_date: string;
  created_at?: string;
}

const VirtualCoffeeTable: React.FC = () => {
  const [rsvps, setRsvps] = useState<CoffeeRSVP[]>([]);
  const [hasRSVPed, setHasRSVPed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Fetch RSVPs for today
  useEffect(() => {
    fetchTodayRSVPs();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('lounge_coffee_rsvp_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lounge_coffee_rsvp'
        },
        (payload) => {
          console.log('Coffee RSVP change received:', payload);
          fetchTodayRSVPs(); // Refresh the list
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      
      // Check if current user has already RSVPed (for now, using simple check)
      // In a real app, you'd check against the authenticated user's ID
      const userHasRSVPed = (data || []).some(rsvp => 
        rsvp.display_name === 'Anonymous' // This would be replaced with actual user check
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
            display_name: 'Anonymous', // Would be replaced with actual user name
            event_date: todayDate,
            user_id: null // Would be replaced with actual user ID when auth is implemented
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
