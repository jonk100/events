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
}

export interface CountryEventRange {
  country_id: string;
  ranges: MonthRange[];
}

export interface Comment {
  id: string;
  event_occurrence_id: string;
  comment: string;
  created_at: string;
}