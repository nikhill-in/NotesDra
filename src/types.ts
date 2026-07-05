/**
 * Notesdra Shared Definitions and Schema Interfaces
 */

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  is_verified?: boolean;
  is_banned?: boolean;
  search_count_today: number;
  search_reset_at: string;
  created_at: string;
}

export interface SearchLog {
  id: string;
  user_id?: string;
  username?: string;
  query: string;
  sources_fetched: string[];
  ip_address: string;
  created_at: string;
}

export interface Advertisement {
  id: string;
  title: string;
  image_url: string;
  target_url: string;
  placement_zone: 'header' | 'sidebar' | 'inline' | 'footer';
  is_active: boolean;
  start_date: string;
  end_date: string;
  click_count: number;
  impression_count: number;
  created_by?: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string; // rich HTML/markdown
  cover_image_url: string;
  tags: string[];
  author_id: string;
  author_name: string;
  is_published: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  content: string;
  parent_comment_id?: string; // null for top tier
  is_deleted: boolean;
  created_at: string;
}

export interface AITool {
  id: string;
  name: string;
  description: string;
  category: 'writing' | 'coding' | 'image' | 'video' | 'audio' | 'research' | 'productivity' | 'other';
  website_url: string;
  logo_url: string;
  free_tier_details: string;
  is_featured: boolean;
  added_by?: string;
  created_at: string;
}

export interface IDESession {
  id: string;
  user_id: string;
  code: string;
  language: string;
  output: string;
  savedAt: string;
}

export interface ConversionHistory {
  id: string;
  user_id?: string;
  originalFormat: string;
  targetFormat: string;
  fileSize: number;
  status: string;
  createdAt: string;
}

export interface ActiveSession {
  id: string;
  user_id?: string;
  username?: string;
  ip_address: string;
  user_agent: string;
  last_seen: string;
  page: string;
}

// Scraped API source structure
export interface AggregationResult {
  source: 'mdn' | 'w3schools' | 'geeksforgeeks' | 'tutorialspoint' | 'javatpoint' | 'wikipedia' | 'medium' | 'stackoverflow';
  title: string;
  content: string;
  url: string;
  snippet?: string;
}

export interface SearchCacheItem {
  query: string;
  results: AggregationResult[];
  expiresAt: string;
}
