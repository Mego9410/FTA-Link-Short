export type Company = {
  /** Same as slug — kept as `id` for convenience in the UI. */
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type LinkRow = {
  /** Same as short_code — unique within a company. */
  id: string;
  slug: string;
  original_url: string;
  short_code: string;
  title: string | null;
  click_count: number;
  created_at: string;
};

export type ClickRow = {
  created_at: string;
  referrer: string | null;
  user_agent: string | null;
};

export type LinkDailySeries = {
  id: string;
  code: string;
  label: string;
  total: number;
  daily: number[];
};

export type CompanyClickSeries = {
  /** UTC date keys (yyyy-mm-dd), oldest first, one per day. */
  dayKeys: string[];
  /** Human-friendly labels matching dayKeys (e.g. "3 Jun"). */
  labels: string[];
  links: LinkDailySeries[];
};
