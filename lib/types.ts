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
