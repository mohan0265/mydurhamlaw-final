-- Create specialists table for MyDurhamLaw

-- Specialists table to store professional advisors
create table if not exists specialists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  title text not null,
  department text,
  specialization text[] default '{}',
  bio text,
  email text,
  phone text,
  office_location text,
  office_hours text,
  booking_url text,
  avatar_url text,
  is_active boolean default true,
  availability_status text default 'available' check (availability_status in ('available', 'busy', 'away', 'offline')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table specialists enable row level security;

-- RLS policies
create policy "Specialists are viewable by all authenticated users"
  on specialists for select
  using (auth.role() = 'authenticated' and is_active = true);

create policy "Specialists can update their own profiles"
  on specialists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Only admins can insert specialists"
  on specialists for insert
  with check (auth.jwt() ->> 'user_role' = 'admin');

create policy "Only admins can delete specialists"
  on specialists for delete
  using (auth.jwt() ->> 'user_role' = 'admin');

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_specialists_updated_at
  before update on specialists
  for each row
  execute function update_updated_at_column();

-- Insert some sample specialists data
insert into specialists (name, title, department, specialization, bio, email, office_location, office_hours, avatar_url) values
(
  'Dr. Sarah Mitchell',
  'Senior Academic Advisor',
  'Law School Administration',
  '{"Academic Planning", "Career Guidance", "Study Skills"}',
  'Dr. Mitchell has over 15 years of experience in legal education and student mentorship. She specializes in helping students navigate their academic journey and develop effective study strategies.',
  'sarah.mitchell@durham.ac.uk',
  'Law Building, Room 201',
  'Monday-Friday: 9:00 AM - 5:00 PM',
  '/images/specialists/sarah-mitchell.jpg'
),
(
  'Prof. James Harrison',
  'Wellbeing Coordinator',
  'Student Support Services',
  '{"Mental Health", "Stress Management", "Work-Life Balance"}',
  'Professor Harrison is a licensed counselor and wellbeing expert. He provides support for students dealing with academic stress and helps develop healthy coping mechanisms.',
  'james.harrison@durham.ac.uk',
  'Student Services Building, Ground Floor',
  'Tuesday-Thursday: 10:00 AM - 4:00 PM',
  '/images/specialists/james-harrison.jpg'
),
(
  'Ms. Elena Rodriguez',
  'Career Development Specialist',
  'Career Services',
  '{"Career Planning", "Interview Preparation", "Industry Networking"}',
  'Elena specializes in helping law students transition into their professional careers. She has extensive connections in the legal industry and provides practical career guidance.',
  'elena.rodriguez@durham.ac.uk',
  'Career Centre, 2nd Floor',
  'Monday, Wednesday, Friday: 1:00 PM - 6:00 PM',
  '/images/specialists/elena-rodriguez.jpg'
),
(
  'Dr. Michael Thompson',
  'Research Methods Advisor',
  'Law Faculty',
  '{"Research Methodology", "Dissertation Support", "Legal Writing"}',
  'Dr. Thompson guides students through complex legal research projects and dissertation writing. His expertise spans multiple areas of law with a focus on research excellence.',
  'michael.thompson@durham.ac.uk',
  'Law Library, Study Room 5',
  'Monday-Wednesday: 2:00 PM - 6:00 PM',
  '/images/specialists/michael-thompson.jpg'
),
(
  'Ms. Rachel Chen',
  'International Student Advisor',
  'International Office',
  '{"Visa Support", "Cultural Adaptation", "Academic Integration"}',
  'Rachel provides specialized support for international law students, helping them navigate UK academic culture and legal education requirements.',
  'rachel.chen@durham.ac.uk',
  'International House, 1st Floor',
  'Tuesday-Friday: 9:00 AM - 3:00 PM',
  '/images/specialists/rachel-chen.jpg'
);
