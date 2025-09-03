import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const VirtualCoffeeTable: React.FC = () => {
  const [rsvp, setRSVP] = useState(false);

  return (
    <div className="bg-gradient-to-br from-yellow-100 via-orange-100 to-amber-100 rounded-2xl shadow px-4 py-3 mb-4">
      <h3 className="font-bold text-lg mb-1">☕ Virtual Coffee Table</h3>
      <div className="text-sm">Daily drop-in: <span className="font-semibold">5-5:20pm</span> | Host: Any student</div>
      <Button
        size="sm"
        className="mt-2"
        onClick={() => setRSVP(true)}
        disabled={rsvp}
        aria-pressed={rsvp}
      >
        {rsvp ? "Marked as Attending" : "RSVP to Join"}
      </Button>
      {rsvp && <div className="text-xs text-green-500 mt-1">See you at the table!</div>}
      <div className="text-xs text-gray-400 mt-1">Make friends—zero pressure, all welcome.</div>
    </div>
  );
};

export default VirtualCoffeeTable;
