-- Academic Planner schema for MyDurhamLaw
-- Uses integer PKs to avoid uuid extension requirements

create table if not exists terms (
  id bigserial primary key,
  academic_year text not null, -- e.g., "2025-26"
  term_code text not null, -- MIC, EPI, EAS
  term_name text not null, -- "Michaelmas", "Epiphany (Lent)", "Easter"
  start_date date not null,
  end_date date not null,
  notes text default '',
  unique (academic_year, term_code)
);

create table if not exists modules (
  id bigserial primary key,
  academic_year text not null, -- "2025-26"
  year_of_study smallint not null, -- 1, 2, or 3 (add 0 for Foundation later if needed)
  module_code text not null, -- e.g., "LAW101"
  module_title text not null,
  compulsory boolean not null default false,
  credits smallint not null default 20,
  unique (academic_year, module_code)
);

-- Which term(s) a module runs in
create table if not exists module_terms (
  id bigserial primary key,
  module_id bigint not null references modules(id) on delete cascade,
  term_id bigint not null references terms(id) on delete cascade,
  teaching_weeks smallint not null default 10,
  assessment_in_term boolean not null default false,
  unique (module_id, term_id)
);

-- Assessments (exam / coursework / oral etc.)
create table if not exists assessments (
  id bigserial primary key,
  module_id bigint not null references modules(id) on delete cascade,
  assessment_name text not null, -- e.g., "Final Exam", "Essay 1"
  assessment_type text not null check (assessment_type in ('exam','coursework','oral','presentation','practical')),
  weight_percent numeric(5,2) not null check (weight_percent >= 0 and weight_percent <= 100),
  window_start date, -- assessment window (optional if due_date used)
  window_end date,
  due_date date, -- specific due date (optional if using window)
  due_time time without time zone default '17:00',
  notes text default ''
);

-- Helpful indexes
create index if not exists idx_terms_year on terms(academic_year);
create index if not exists idx_modules_year on modules(academic_year, year_of_study);
create index if not exists idx_assessments_module on assessments(module_id);

