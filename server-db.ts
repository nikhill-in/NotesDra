import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import { 
  User, BlogPost, BlogComment, BlogLike, AITool, 
  IDESession, SearchLog, ConversionHistory, ActiveSession,
  Advertisement 
} from './src/types';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Memory cache + file backing
interface Schema {
  users: User[];
  passwords: Record<string, string>; // userId -> password_hash
  blog_posts: BlogPost[];
  blog_likes: BlogLike[];
  blog_comments: BlogComment[];
  ai_tools: AITool[];
  ide_sessions: IDESession[];
  search_logs: SearchLog[];
  conversion_history: ConversionHistory[];
  active_sessions: ActiveSession[];
  advertisements: Advertisement[];
}

let db: Schema = {
  users: [],
  passwords: {},
  blog_posts: [],
  blog_likes: [],
  blog_comments: [],
  ai_tools: [],
  ide_sessions: [],
  search_logs: [],
  conversion_history: [],
  active_sessions: [],
  advertisements: [],
};

// Ensure db directory and file exist with initial seed data
export function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
    } catch (e) {
      console.error('Error reading database file, resetting to empty', e);
      writeDb();
    }
  } else {
    // Generate initial seeds!
    seedDb();
    writeDb();
  }
}

function writeDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write database file', e);
  }
}

function seedDb() {
  // Create an admin user: admin@notesdra.com / admin123
  const adminId = 'admin-uuid-1111-2222-333333333333';
  const adminUser: User = {
    id: adminId,
    email: 'admin@notesdra.com',
    username: 'admin',
    role: 'admin',
    is_verified: true,
    is_banned: false,
    search_count_today: 0,
    search_reset_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  
  // Bcrypt is async, so we'll store a plain representation or we handle it in our auth code.
  // We'll store a sha256 or md5 for simplicity if we can, or standard bcrypt hash.
  // Wait, let's use a standard bcrypt hash for "admin123" so bcryptjs on the server can verify it perfectly!
  // The bcrypt hash for "admin123" with 12 rounds is: "$2a$12$6K0Z77T0V1Gofj0gC0VfReeI6F7Wd85f3S9/Wl7R2Z2m2f8Y7G2Hq" (or let's use a simpler known hash for "password123")
  // Let's store a generic hash for "password123": "$2y$10$w3b.u26U2P29r17f9R6N9u9.P8m7a1gXvG6G9vO6V4R8r7Y7d9T8q" (common password123 hash)
  // Let's generate it using a real helper or standard salt. Let's write the actual bcrypt hash for "password123":
  // "password123" is commonly: $2f$10$N9qo8uLOqp4M8pM9v1ZKeOrgEq0K6nZgJbZ1p1sSDe4z8wY0i.8I2 (or we can just run bcrypt.hashSync inside)
  // Yes! We can import bcrypt and hash it dynamically in seedDb so it is 100% correct! We installed bcryptjs. Let's do that!
  
  db.users.push(adminUser);
  db.passwords[adminId] = bcryptjs.hashSync('admin123', 12);

  // Seed standard Guest/User demo too if they want
  const demoUserId = 'demo-uuid-2222-3333-444444444444';
  const demoUser: User = {
    id: demoUserId,
    email: 'user@notesdra.com',
    username: 'demouser',
    role: 'user',
    is_verified: true,
    is_banned: false,
    search_count_today: 0,
    search_reset_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  db.users.push(demoUser);
  db.passwords[demoUserId] = bcryptjs.hashSync('user123', 12);

  // Seed AI Tools
  const aiTools: AITool[] = [
    {
      id: 'ai-1',
      name: 'Gemini Web Assister',
      description: 'Googles powerful multimodal conversational agent that helps draft code, generate diagrams, and perform extensive reasoning.',
      category: 'research',
      website_url: 'https://gemini.google.com',
      logo_url: '/logo-gemini.png',
      free_tier_details: 'Unbelievably rich free tier with Gemini 1.5 & Flash models, higher rates on subscription.',
      is_featured: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ai-2',
      name: 'v0 by Vercel',
      description: 'Generative UI system that builds modern clean web applications and react components based on a simple prompt.',
      category: 'coding',
      website_url: 'https://v0.dev',
      logo_url: '/logo-v0.png',
      free_tier_details: 'Credits given daily for standard UI iterations.',
      is_featured: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ai-3',
      name: 'Claude 3.5 Sonnet',
      description: 'Anthropic\'s top model specializing in outstanding coding, writing, and analytical tasks.',
      category: 'coding',
      website_url: 'https://claude.ai',
      logo_url: '/logo-claude.png',
      free_tier_details: 'Limited free access refreshed every 5 hours.',
      is_featured: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ai-4',
      name: 'Midjourney v6',
      description: 'Photorealistic image generation platform powered by Discord communities.',
      category: 'image',
      website_url: 'https://midjourney.com',
      logo_url: '/logo-midjourney.png',
      free_tier_details: 'Subscription only, occasional high tier free trials.',
      is_featured: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ai-5',
      name: 'ElevenLabs Speech',
      description: 'Prime speech synthesis, realistic voice cloning, and multilingual sound design tool.',
      category: 'audio',
      website_url: 'https://elevenlabs.io',
      logo_url: '/logo-eleven.png',
      free_tier_details: '10,000 free characters per month with standard voices.',
      is_featured: false,
      created_at: new Date().toISOString(),
    }
  ];
  db.ai_tools = aiTools;

  // Seed Advertisements
  const ads: Advertisement[] = [
    {
      id: 'ad-1',
      title: 'Upgrade to Notesdra Enterprise',
      image_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=600&auto=format&fit=crop',
      target_url: 'https://ai.studio/build',
      placement_zone: 'sidebar',
      is_active: true,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years out
      click_count: 142,
      impression_count: 1259,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ad-2',
      title: 'Get Free Gemini Credits on Google Cloud Console',
      image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
      target_url: 'https://cloud.google.com',
      placement_zone: 'header',
      is_active: true,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      click_count: 85,
      impression_count: 3105,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ad-3',
      title: 'Notesdra Code Editor v2 is now Live!',
      image_url: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?q=80&w=600&auto=format&fit=crop',
      target_url: '#',
      placement_zone: 'footer',
      is_active: true,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      click_count: 0,
      impression_count: 121,
      created_at: new Date().toISOString(),
    }
  ];
  db.advertisements = ads;

  // Seed Blog Posts
  const blogPosts: BlogPost[] = [
    {
      id: 'blog-1',
      title: 'Understanding Modern CSS Layouts: Flexbox vs Grid',
      slug: 'understanding-modern-css-layouts',
      content: `<h2>Understanding CSS Layout Engines</h2><p>CSS layout engines are more powerful than they have ever been. For a long time, standard front-end developers had to rely on floating containers, absolute positions, or HTML tables to format side-by-side components. Today, we have two primary native giants: <strong>Flexbox (Flexible Box Layout)</strong> and <strong>CSS Grid Layout</strong>.</p><h3>When to use Flexbox?</h3><p>Flexbox works best when laying out elements along a single dimensional track (either horizontally across a row, or vertically down a column). It is content-driven, meaning that items are sized based on their internal contents and can flow dynamically to fill up space.</p><ul><li>Header navbars with evenly distributed options</li><li>Input groups with icons and buttons side-by-side</li><li>Sidebar lists with aligned avatar badges</li></ul><h3>When to use CSS Grid?</h3><p>Grid is built for two-dimensional structures (both rows and columns simultaneously). It is layout-driven, meaning that you declare the overall structural skeleton first, and elements snap into the pre-defined cells. Use Grid for major dashboard layouts, gallery tables, or advanced asymmetric bento-grids.</p>`,
      cover_image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600&auto=format&fit=crop',
      tags: ['CSS', 'Frontend', 'Design'],
      author_id: adminId,
      author_name: 'Lead Architect',
      is_published: true,
      view_count: 421,
      like_count: 31,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'blog-2',
      title: 'Top 10 AI Tools All Modern Product Designers Need in 2026',
      slug: 'top-10-ai-tools-designers-2026',
      content: `<h2>The Design Automation Revolution</h2><p>As we navigate through 2026, artificial intelligence wraps securely into our creative tools. Gone are the days of manual vector adjustments for simple mockup concepts. Designers are expected to co-create with smart engines, acting as creative directors rather than pixel pushers.</p><h3>The Vital Directory</h3><p>Here is a review of the top spaces redefining how UI elements, high-fidelity landing pages, and production code are generated right from natural language drafts:</p><ol><li><strong>Gemini 3.5</strong>: Exceptional reasoning for technical flows and logic mapping. This system designs beautiful mockups when asked properly.</li><li><strong>v0 by Vercel</strong>: Immersive React elements created based directly on your layout requirements.</li><li><strong>Midjourney v6</strong>: High quality assets, illustrations, and isometric vectors for web hero headers.</li></ol>`,
      cover_image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop',
      tags: ['AI', 'UI/UX', 'Productivity'],
      author_id: adminId,
      author_name: 'Lead Architect',
      is_published: true,
      view_count: 185,
      like_count: 14,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];
  db.blog_posts = blogPosts;

  // Seed Blog Comments
  db.blog_comments = [
    {
      id: 'comment-1',
      post_id: 'blog-1',
      user_id: demoUserId,
      username: 'demouser',
      content: 'This is the most straightforward explanation of Flexbox and Grid. Flexbox is so useful for buttons and header logs, and Grid is amazing for cards!',
      is_deleted: false,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'comment-2',
      post_id: 'blog-1',
      user_id: adminId,
      username: 'admin',
      content: 'Exactly! Combining them is the sweet spot. You can use CSS Grid for the card list container and Flexbox for matching content within the individual cards.',
      parent_comment_id: 'comment-1',
      is_deleted: false,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];
}

export const dbService = {
  getUsers() { return db.users; },
  getUserById(id: string) { return db.users.find(u => u.id === id); },
  getUserByEmail(email: string) { return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()); },
  getUserByUsername(username: string) { return db.users.find(u => u.username.toLowerCase() === username.toLowerCase()); },
  getPasswords() { return db.passwords; },
  addUser(user: User, passwordHash: string) {
    db.users.push(user);
    db.passwords[user.id] = passwordHash;
    writeDb();
    return user;
  },
  updateUser(id: string, updates: Partial<User>) {
    const idx = db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...updates };
      writeDb();
      return db.users[idx];
    }
    return null;
  },
  deleteUser(id: string) {
    db.users = db.users.filter(u => u.id !== id);
    delete db.passwords[id];
    writeDb();
  },

  getBlogPosts() { return db.blog_posts; },
  getBlogPostBySlug(slug: string) { return db.blog_posts.find(b => b.slug === slug); },
  addBlogPost(post: BlogPost) {
    db.blog_posts.push(post);
    writeDb();
    return post;
  },
  updateBlogPost(id: string, updates: Partial<BlogPost>) {
    const idx = db.blog_posts.findIndex(b => b.id === id);
    if (idx !== -1) {
      db.blog_posts[idx] = { ...db.blog_posts[idx], ...updates, updated_at: new Date().toISOString() };
      writeDb();
      return db.blog_posts[idx];
    }
    return null;
  },
  deleteBlogPost(id: string) {
    db.blog_posts = db.blog_posts.filter(b => b.id !== id);
    db.blog_comments = db.blog_comments.filter(c => c.post_id !== id);
    db.blog_likes = db.blog_likes.filter(l => l.post_id !== id);
    writeDb();
  },

  getBlogComments() { return db.blog_comments; },
  addBlogComment(comment: BlogComment) {
    db.blog_comments.push(comment);
    writeDb();
    return comment;
  },
  updateBlogComment(id: string, content: string) {
    const idx = db.blog_comments.findIndex(c => c.id === id);
    if (idx !== -1) {
      db.blog_comments[idx].content = content;
      writeDb();
      return db.blog_comments[idx];
    }
    return null;
  },
  deleteBlogComment(id: string) {
    const idx = db.blog_comments.findIndex(c => c.id === id);
    if (idx !== -1) {
      db.blog_comments[idx].is_deleted = true;
      writeDb();
      return db.blog_comments[idx];
    }
    return null;
  },

  getBlogLikes() { return db.blog_likes; },
  toggleLike(post_id: string, user_id: string) {
    const index = db.blog_likes.findIndex(l => l.post_id === post_id && l.user_id === user_id);
    const postIdx = db.blog_posts.findIndex(p => p.id === post_id);
    
    if (index !== -1) {
      db.blog_likes.splice(index, 1);
      if (postIdx !== -1) db.blog_posts[postIdx].like_count = Math.max(0, db.blog_posts[postIdx].like_count - 1);
      writeDb();
      return { liked: false };
    } else {
      const newLike: BlogLike = {
        id: crypto.randomUUID(),
        post_id,
        user_id,
        created_at: new Date().toISOString(),
      };
      db.blog_likes.push(newLike);
      if (postIdx !== -1) db.blog_posts[postIdx].like_count += 1;
      writeDb();
      return { liked: true };
    }
  },

  getAITools() { return db.ai_tools; },
  getAIToolById(id: string) { return db.ai_tools.find(t => t.id === id); },
  addAITool(tool: AITool) {
    db.ai_tools.push(tool);
    writeDb();
    return tool;
  },
  updateAITool(id: string, updates: Partial<AITool>) {
    const idx = db.ai_tools.findIndex(t => t.id === id);
    if (idx !== -1) {
      db.ai_tools[idx] = { ...db.ai_tools[idx], ...updates };
      writeDb();
      return db.ai_tools[idx];
    }
    return null;
  },
  deleteAITool(id: string) {
    db.ai_tools = db.ai_tools.filter(t => t.id !== id);
    writeDb();
  },

  getAdvertisements() { return db.advertisements; },
  addAdvertisement(ad: Advertisement) {
    db.advertisements.push(ad);
    writeDb();
    return ad;
  },
  updateAdvertisement(id: string, updates: Partial<Advertisement>) {
    const idx = db.advertisements.findIndex(a => a.id === id);
    if (idx !== -1) {
      db.advertisements[idx] = { ...db.advertisements[idx], ...updates };
      writeDb();
      return db.advertisements[idx];
    }
    return null;
  },
  deleteAdvertisement(id: string) {
    db.advertisements = db.advertisements.filter(a => a.id !== id);
    writeDb();
  },
  clickAdvertisement(id: string) {
    const idx = db.advertisements.findIndex(a => a.id === id);
    if (idx !== -1) {
      db.advertisements[idx].click_count += 1;
      writeDb();
    }
  },
  impressAdvertisement(id: string) {
    const idx = db.advertisements.findIndex(a => a.id === id);
    if (idx !== -1) {
      db.advertisements[idx].impression_count += 1;
      writeDb();
    }
  },

  getSearchLogs() { return db.search_logs; },
  addSearchLog(log: SearchLog) {
    db.search_logs.push(log);
    writeDb();
    return log;
  },

  getConversionHistory() { return db.conversion_history; },
  addConversionHistory(history: ConversionHistory) {
    db.conversion_history.push(history);
    writeDb();
    return history;
  },

  getIDESessions() { return db.ide_sessions; },
  addIDESession(session: IDESession) {
    db.ide_sessions.push(session);
    writeDb();
    return session;
  },
  getIDESessionsByUser(userId: string) {
    return db.ide_sessions.filter(s => s.user_id === userId);
  },

  getActiveSessions() { return db.active_sessions; },
  updateActiveSession(ip: string, userAgent: string, page: string, userId?: string, username?: string) {
    const now = new Date().toISOString();
    const existingIdx = db.active_sessions.findIndex(s => s.ip_address === ip && s.user_agent === userAgent);
    if (existingIdx !== -1) {
      db.active_sessions[existingIdx] = {
        ...db.active_sessions[existingIdx],
        user_id: userId || db.active_sessions[existingIdx].user_id,
        username: username || db.active_sessions[existingIdx].username,
        last_seen: now,
        page,
      };
    } else {
      const newSession: ActiveSession = {
        id: crypto.randomUUID(),
        user_id: userId,
        username,
        ip_address: ip,
        user_agent: userAgent,
        last_seen: now,
        page,
      };
      db.active_sessions.push(newSession);
    }
    // Prune sessions older than 5 minutes for clean admin visual metrics
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    db.active_sessions = db.active_sessions.filter(s => new Date(s.last_seen).getTime() > fiveMinutesAgo);
    writeDb();
  }
};
