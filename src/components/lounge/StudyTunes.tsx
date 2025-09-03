import React from "react";

const playlists = [
  { title: "Lofi Study", url: "https://www.youtube.com/watch?v=jfKfPfyJRdk" },
  { title: "Classical Calm", url: "https://www.youtube.com/watch?v=GRxofEmo3HA" },
  { title: "Ambient Focus", url: "https://www.youtube.com/watch?v=5qap5aO4i9A" },
  { title: "Jazz Cafe", url: "https://www.youtube.com/watch?v=Dx5qFachd3A" },
];

const StudyTunes: React.FC = () => (
  <div className="bg-gradient-to-br from-pink-100 via-red-100 to-rose-100 rounded-2xl shadow px-4 py-3 mb-4">
    <h3 className="font-bold text-lg mb-1">🎶 Study Tunes</h3>
    <ul>
      {playlists.map(p => (
        <li key={p.title}>
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 hover:text-purple-600 text-sm">{p.title}</a>
        </li>
      ))}
    </ul>
    <div className="text-xs text-gray-400 mt-1">Listen together—or find your flow solo.</div>
  </div>
);

export default StudyTunes;
