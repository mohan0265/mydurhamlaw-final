import { z } from 'zod';

export const TopicZ = z.object({
  title: z.string(),
  day: z.enum(['Mon','Tue','Wed','Thu','Fri']),
  module_code: z.string(),
  module_name: z.string().optional(),
  ref_slug: z.string().optional(),
  order_idx: z.number().optional()
});

export const WeekZ = z.object({
  week_no: z.number(),
  start_date: z.string(),
  end_date: z.string(),
  topics: z.array(TopicZ)
});

export const TermZ = z.object({
  slug: z.string(),
  name: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  weeks: z.array(WeekZ)
});

export const YearZ = z.object({
  label: z.string(),
  year_number: z.number().int().min(1).max(4),
  terms: z.array(TermZ)
});

export type Topic = z.infer<typeof TopicZ>;
export type Week = z.infer<typeof WeekZ>;
export type Term = z.infer<typeof TermZ>;
export type Year = z.infer<typeof YearZ>;