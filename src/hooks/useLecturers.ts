import { useState, useEffect } from "react";

export interface Lecturer {
  id: string;
  name: string;
  lectureCount: number;
}

export function useLecturers() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lecturers/list")
      .then((res) => res.json())
      .then((data) => {
        setLecturers(data.lecturers || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load lecturers", err);
        setLoading(false);
      });
  }, []);

  return { lecturers, loading };
}
