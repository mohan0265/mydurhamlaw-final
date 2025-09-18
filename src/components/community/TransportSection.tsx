import React from "react";

const RAIL_LINK = "https://www.nationalrail.co.uk/stations/dur/";
const BUS_LINK = "https://www.arrivabus.co.uk/find-a-service";
const TAXI_NUM = "0191 386 6662";
const AIRPORT_NCL = "https://www.newcastleairport.com/";
const AIRPORT_MME = "https://www.durhamteesvalleyairport.com/";

export default function TransportSection() {
  return (
    <section id="transport" aria-labelledby="transport-heading" className="mb-8">
      <h2 id="transport-heading" className="text-2xl font-bold mb-4 text-indigo-700">Transport</h2>
      <ul className="grid md:grid-cols-2 gap-4">
        <li className="bg-white rounded p-3">
          <strong>Durham Rail Station</strong><br />
          <a href={RAIL_LINK} target="_blank" rel="noopener noreferrer" className="btn-primary">View Info / Trains</a>
        </li>
        <li className="bg-white rounded p-3">
          <strong>Buses (Arriva, Go North East):</strong><br />
          <a href={BUS_LINK} target="_blank" rel="noopener noreferrer" className="btn-secondary">Bus Timetables</a>
        </li>
        <li className="bg-white rounded p-3">
          <strong>Local Taxi (1A Taxis):</strong><br />
          <a href={`tel:${TAXI_NUM}`} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Call {TAXI_NUM}
          </a>
        </li>
        <li className="bg-white rounded p-3">
          <strong>Airports</strong><br />
          <a href={AIRPORT_NCL} target="_blank" rel="noopener noreferrer" className="btn-secondary">Newcastle (NCL)</a>
          <a href={AIRPORT_MME} target="_blank" rel="noopener noreferrer" className="btn-secondary ml-2">Teesside (MME)</a>
        </li>
      </ul>
    </section>
  );
}
