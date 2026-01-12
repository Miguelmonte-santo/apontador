
export interface ScrapedItem {
  id: string | number;
  title: string;
  link: string;
  description?: string;
  price?: string | number;
  category?: string;
  timestamp: string;
}

export interface ScrapeResponse {
  success: boolean;
  data: ScrapedItem[];
  error?: string;
}

export enum ScrapeStatus {
  IDLE = 'IDLE',
  SCRAPING = 'SCRAPING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
