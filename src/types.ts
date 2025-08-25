export interface Event {
  id: string;
  name: string;
  created_at: string;
}

export interface Country {
  id: string;
  name: string;
  created_at: string;
}

export interface EventOccurrence {
  id: string;
  event_id: string;
  country_id: string;
  start_month: number;
  end_month: number;
  created_at: string;
}

export interface EventWithOccurrences extends Event {
  occurrences: (EventOccurrence & { country: Country })[];
}

export interface MonthRange {
  start_month: number;
  end_month: number;
  /** The existing event_occurrence.id this range corresponds to (if any) */
  occurrence_id?: string;
}

export interface CountryEventRange {
  country_id: string;
  /** Optional human-readable name used in edit forms */
  country_name?: string;
  ranges: MonthRange[];
}

export interface Comment {
  id: string;
  event_occurrence_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
}