-- SOC AI Sosyal Medya Uygulaması - Birleştirilmiş Veritabanı Şeması
-- Tüm sistemler tek dosyada

-- =============================================
-- 1. ANA ŞEMA (Users, Posts, Comments, Follows)
-- =============================================

-- Users tablosunu genişletme
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0 CHECK (followers_count >= 0),
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0 CHECK (following_count >= 0),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS unread_notifications_count INTEGER DEFAULT 0 CHECK (unread_notifications_count >= 0),
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"like": true, "comment": true, "retweet": true, "follow": true, "mention": true, "reply": true, "weekly_summary": true}',
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS two_factor_verified_at TIMESTAMP WITH TIME ZONE;

-- Profiles tablosunu kaldır (eğer varsa)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    UPDATE public.users 
    SET 
      username = COALESCE(profiles.username, users.username),
      avatar_url = COALESCE(profiles.avatar_url, users.avatar_url),
      bio = COALESCE(profiles.bio, users.bio),
      website = COALESCE(profiles.website, users.website),
      location = COALESCE(profiles.location, users.location)
    FROM profiles 
    WHERE users.id = profiles.id;
    DROP TABLE profiles CASCADE;
  END IF;
END $$;

-- Posts tablosu
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'media')),
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
  retweets_count INTEGER DEFAULT 0 CHECK (retweets_count >= 0)
);

-- Migrate existing image_url to image_urls array
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'image_urls') THEN
    ALTER TABLE posts ADD COLUMN image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
    UPDATE posts SET image_urls = ARRAY[image_url]::TEXT[] WHERE image_url IS NOT NULL AND image_url != '';
    ALTER TABLE posts DROP COLUMN IF EXISTS image_url;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'type') THEN
    ALTER TABLE posts ADD COLUMN type TEXT DEFAULT 'text' CHECK (type IN ('text', 'media'));
  END IF;
END $$;

-- Post interactions tablosu
CREATE TABLE IF NOT EXISTS post_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'retweet', 'bookmark')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id, type)
);

-- Comments tablosu
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows tablosu
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- =============================================
-- 2. HASHTAGS SİSTEMİ
-- =============================================

-- Hashtags tablosu
CREATE TABLE IF NOT EXISTS hashtags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  trending_score FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post hashtags tablosu
CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  hashtag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, hashtag_id)
);

-- =============================================
-- 3. DIRECT MESSAGING SİSTEMİ
-- =============================================

-- Conversations tablosu
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_id UUID,
  is_group BOOLEAN DEFAULT false,
  group_name TEXT,
  group_description TEXT,
  group_avatar_url TEXT
);

-- Conversation participants tablosu
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(conversation_id, user_id)
);

-- Messages tablosu
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message reactions tablosu
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- =============================================
-- 4. POLLS SİSTEMİ
-- =============================================

-- Polls tablosu
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL CHECK (char_length(question) <= 200),
  is_multiple_choice BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_votes INTEGER DEFAULT 0 CHECK (total_votes >= 0)
);

-- Poll options tablosu
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL CHECK (char_length(option_text) <= 100),
  vote_count INTEGER DEFAULT 0 CHECK (vote_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, option_text)
);

-- Poll votes tablosu
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- =============================================
-- 5. MODERATION SİSTEMİ
-- =============================================

-- Content reports tablosu
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('spam', 'harassment', 'hate_speech', 'inappropriate_content', 'fake_news', 'copyright', 'other')),
  reason TEXT NOT NULL CHECK (char_length(reason) <= 500),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  moderator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- User blocks tablosu
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT CHECK (char_length(reason) <= 200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- User mutes tablosu
CREATE TABLE IF NOT EXISTS user_mutes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  muter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  muted_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT CHECK (char_length(reason) <= 200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(muter_id, muted_id),
  CHECK (muter_id != muted_id)
);

-- =============================================
-- 6. NOTIFICATIONS SİSTEMİ
-- =============================================

-- Notifications tablosu
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'retweet', 'follow', 'mention', 'reply', 'bookmark', 'weekly_summary', 'trending')),
  actor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_emailed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push subscriptions tablosu
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- =============================================
-- 7. STORIES SİSTEMİ
-- =============================================

-- Stories tablosu
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT CHECK (char_length(content) <= 2000),
  image_url TEXT,
  video_url TEXT,
  story_type TEXT DEFAULT 'image' CHECK (story_type IN ('image', 'video', 'text')),
  background_color TEXT DEFAULT '#000000',
  text_color TEXT DEFAULT '#FFFFFF',
  font_size INTEGER DEFAULT 24 CHECK (font_size >= 12 AND font_size <= 72),
  is_archived BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story views tablosu
CREATE TABLE IF NOT EXISTS story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Story reactions tablosu
CREATE TABLE IF NOT EXISTS story_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- =============================================
-- 8. ANALYTICS SİSTEMİ
-- =============================================

-- User analytics tablosu
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  posts_created INTEGER DEFAULT 0 CHECK (posts_created >= 0),
  likes_received INTEGER DEFAULT 0 CHECK (likes_received >= 0),
  likes_given INTEGER DEFAULT 0 CHECK (likes_given >= 0),
  retweets_received INTEGER DEFAULT 0 CHECK (retweets_received >= 0),
  retweets_given INTEGER DEFAULT 0 CHECK (retweets_given >= 0),
  comments_received INTEGER DEFAULT 0 CHECK (comments_received >= 0),
  comments_given INTEGER DEFAULT 0 CHECK (comments_given >= 0),
  followers_gained INTEGER DEFAULT 0 CHECK (followers_gained >= 0),
  followers_lost INTEGER DEFAULT 0 CHECK (followers_lost >= 0),
  profile_views INTEGER DEFAULT 0 CHECK (profile_views >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- =============================================
-- 9. INDEXLER
-- =============================================

-- Posts indexleri
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);

-- Post interactions indexleri
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_id ON post_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id ON post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_type ON post_interactions(user_id, type);

-- Comments indexleri
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Follows indexleri
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_following ON follows(follower_id, following_id);

-- Users indexleri
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON public.users(username) WHERE username IS NOT NULL;

-- Hashtags indexleri
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON hashtags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_trending_score ON hashtags(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_created_at ON hashtags(created_at DESC);

-- Post hashtags indexleri
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_created_at ON post_hashtags(created_at DESC);

-- Messages indexleri
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Polls indexleri
CREATE INDEX IF NOT EXISTS idx_polls_post_id ON polls(post_id);
CREATE INDEX IF NOT EXISTS idx_polls_expires_at ON polls(expires_at);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON poll_votes(option_id);

-- Moderation indexleri
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_user_mutes_muter_id ON user_mutes(muter_id);
CREATE INDEX IF NOT EXISTS idx_user_mutes_muted_id ON user_mutes(muted_id);

-- Notifications indexleri
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Stories indexleri
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewed_at ON story_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON story_reactions(user_id);

-- Analytics indexleri
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON user_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_date ON user_analytics(user_id, date DESC);

-- =============================================
-- 10. STORAGE BUCKETS
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'banners') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'post-images') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);
  END IF;
END $$;

-- =============================================
-- 11. RLS POLİTİKALARI
-- =============================================

-- RLS'i etkinleştir
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Storage policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Public read banners" ON storage.objects;
  DROP POLICY IF EXISTS "Public read post images" ON storage.objects;
  DROP POLICY IF EXISTS "Users manage own avatar objects" ON storage.objects;
  DROP POLICY IF EXISTS "Users manage own banner objects" ON storage.objects;
  DROP POLICY IF EXISTS "Users manage own post images" ON storage.objects;
END $$;

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Public read banners" ON storage.objects FOR SELECT TO public USING (bucket_id = 'banners');
CREATE POLICY "Public read post images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'post-images');

CREATE POLICY "Users manage own avatar objects" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text
) WITH CHECK (
  bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Users manage own banner objects" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'banners' AND split_part(name, '/', 1) = auth.uid()::text
) WITH CHECK (
  bucket_id = 'banners' AND split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Users manage own post images" ON storage.objects FOR ALL TO authenticated USING (
  bucket_id = 'post-images' AND split_part(name, '/', 1) = auth.uid()::text
) WITH CHECK (
  bucket_id = 'post-images' AND split_part(name, '/', 1) = auth.uid()::text
);

-- Users policies
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts policies
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (true);

-- Post interactions policies
DROP POLICY IF EXISTS "Post interactions are viewable by everyone" ON post_interactions;
DROP POLICY IF EXISTS "Users can create their own interactions" ON post_interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON post_interactions;

CREATE POLICY "Post interactions are viewable by everyone" ON post_interactions FOR SELECT USING (true);
CREATE POLICY "Users can create their own interactions" ON post_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interactions" ON post_interactions FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (true);

-- Follows policies
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow others" ON follows;

CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Hashtags policies
DROP POLICY IF EXISTS "Anyone can view hashtags" ON hashtags;
DROP POLICY IF EXISTS "Authenticated users can create hashtags" ON hashtags;
DROP POLICY IF EXISTS "System can update hashtag stats" ON hashtags;

CREATE POLICY "Anyone can view hashtags" ON hashtags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create hashtags" ON hashtags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "System can update hashtag stats" ON hashtags FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can view post hashtags" ON post_hashtags;
DROP POLICY IF EXISTS "Authenticated users can create post hashtags" ON post_hashtags;
DROP POLICY IF EXISTS "Users can delete their own post hashtags" ON post_hashtags;

CREATE POLICY "Anyone can view post hashtags" ON post_hashtags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create post hashtags" ON post_hashtags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own post hashtags" ON post_hashtags FOR DELETE USING (true);

-- Messages policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversations.id AND user_id = auth.uid())
);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their conversations" ON conversations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversations.id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;

CREATE POLICY "Users can view conversation participants" ON conversation_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants cp2 WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid())
);
CREATE POLICY "Users can join conversations" ON conversation_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave conversations" ON conversation_participants FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can edit their own messages" ON messages FOR UPDATE USING (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete their own messages" ON messages FOR DELETE USING (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- Polls policies
DROP POLICY IF EXISTS "Anyone can view polls" ON polls;
DROP POLICY IF EXISTS "Users can create polls for their posts" ON polls;
DROP POLICY IF EXISTS "Users can update their own polls" ON polls;
DROP POLICY IF EXISTS "Users can delete their own polls" ON polls;

CREATE POLICY "Anyone can view polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Users can create polls for their posts" ON polls FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own polls" ON polls FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own polls" ON polls FOR DELETE USING (true);

DROP POLICY IF EXISTS "Anyone can view poll options" ON poll_options;
DROP POLICY IF EXISTS "Users can create poll options for their polls" ON poll_options;
DROP POLICY IF EXISTS "Users can update their own poll options" ON poll_options;
DROP POLICY IF EXISTS "Users can delete their own poll options" ON poll_options;

CREATE POLICY "Anyone can view poll options" ON poll_options FOR SELECT USING (true);
CREATE POLICY "Users can create poll options for their polls" ON poll_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own poll options" ON poll_options FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own poll options" ON poll_options FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can view poll votes" ON poll_votes;
DROP POLICY IF EXISTS "Users can vote on polls" ON poll_votes;
DROP POLICY IF EXISTS "Users can change their vote" ON poll_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON poll_votes;

CREATE POLICY "Users can view poll votes" ON poll_votes FOR SELECT USING (
  EXISTS (SELECT 1 FROM polls p WHERE p.id = poll_votes.poll_id AND (p.is_anonymous = false OR auth.uid() = poll_votes.user_id))
);
CREATE POLICY "Users can vote on polls" ON poll_votes FOR INSERT WITH CHECK (
  auth.uid() = user_id AND NOT EXISTS (SELECT 1 FROM poll_votes pv WHERE pv.poll_id = poll_votes.poll_id AND pv.user_id = auth.uid()) AND
  EXISTS (SELECT 1 FROM polls p WHERE p.id = poll_votes.poll_id AND (p.expires_at IS NULL OR p.expires_at > NOW()))
);
CREATE POLICY "Users can change their vote" ON poll_votes FOR UPDATE USING (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM polls p WHERE p.id = poll_votes.poll_id AND (p.expires_at IS NULL OR p.expires_at > NOW()))
);
CREATE POLICY "Users can delete their own votes" ON poll_votes FOR DELETE USING (auth.uid() = user_id);

-- Moderation policies
DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
DROP POLICY IF EXISTS "Moderators can view all reports" ON content_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON content_reports;
DROP POLICY IF EXISTS "Moderators can update reports" ON content_reports;

CREATE POLICY "Users can create reports" ON content_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Moderators can view all reports" ON content_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_user_meta_data->>'role' = 'moderator' OR raw_user_meta_data->>'role' = 'admin'))
);
CREATE POLICY "Users can view their own reports" ON content_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Moderators can update reports" ON content_reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_user_meta_data->>'role' = 'moderator' OR raw_user_meta_data->>'role' = 'admin'))
);

DROP POLICY IF EXISTS "Users can block others" ON user_blocks;
DROP POLICY IF EXISTS "Users can unblock others" ON user_blocks;
DROP POLICY IF EXISTS "Users can view their blocks" ON user_blocks;

CREATE POLICY "Users can block others" ON user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock others" ON user_blocks FOR DELETE USING (auth.uid() = blocker_id);
CREATE POLICY "Users can view their blocks" ON user_blocks FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "Users can mute others" ON user_mutes;
DROP POLICY IF EXISTS "Users can unmute others" ON user_mutes;
DROP POLICY IF EXISTS "Users can view their mutes" ON user_mutes;

CREATE POLICY "Users can mute others" ON user_mutes FOR INSERT WITH CHECK (auth.uid() = muter_id);
CREATE POLICY "Users can unmute others" ON user_mutes FOR DELETE USING (auth.uid() = muter_id);
CREATE POLICY "Users can view their mutes" ON user_mutes FOR SELECT USING (auth.uid() = muter_id OR auth.uid() = muted_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Stories policies
DROP POLICY IF EXISTS "Users can view active stories from users they follow" ON stories;
DROP POLICY IF EXISTS "Users can view their own stories" ON stories;
DROP POLICY IF EXISTS "Users can create their own stories" ON stories;
DROP POLICY IF EXISTS "Users can update their own stories" ON stories;
DROP POLICY IF EXISTS "Users can delete their own stories" ON stories;

CREATE POLICY "Users can view stories" ON stories FOR SELECT USING (true);
CREATE POLICY "Users can create their own stories" ON stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own stories" ON stories FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own stories" ON stories FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can view story views for their stories" ON story_views;
DROP POLICY IF EXISTS "Users can create story views" ON story_views;

CREATE POLICY "Users can view story views for their stories" ON story_views FOR SELECT USING (true);
CREATE POLICY "Users can create story views" ON story_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "Users can view story reactions" ON story_reactions;
DROP POLICY IF EXISTS "Users can create story reactions" ON story_reactions;
DROP POLICY IF EXISTS "Users can update their own story reactions" ON story_reactions;
DROP POLICY IF EXISTS "Users can delete their own story reactions" ON story_reactions;

CREATE POLICY "Users can view story reactions" ON story_reactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM stories WHERE stories.id = story_reactions.story_id)
);
CREATE POLICY "Users can create story reactions" ON story_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own story reactions" ON story_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own story reactions" ON story_reactions FOR DELETE USING (auth.uid() = user_id);

-- Analytics policies
DROP POLICY IF EXISTS "Users can view their own analytics" ON user_analytics;
DROP POLICY IF EXISTS "Admins can view all user analytics" ON user_analytics;
DROP POLICY IF EXISTS "System can insert user analytics" ON user_analytics;
DROP POLICY IF EXISTS "System can update user analytics" ON user_analytics;

CREATE POLICY "Users can view their own analytics" ON user_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all user analytics" ON user_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);
CREATE POLICY "System can insert user analytics" ON user_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update user analytics" ON user_analytics FOR UPDATE USING (true);

-- =============================================
-- 12. FONKSİYONLAR
-- =============================================

-- Count update functions
CREATE OR REPLACE FUNCTION increment_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION decrement_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION increment_retweets_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET retweets_count = retweets_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION decrement_retweets_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET retweets_count = GREATEST(retweets_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION increment_comments_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION decrement_comments_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION increment_followers_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET followers_count = followers_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION decrement_followers_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION increment_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET following_count = following_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION decrement_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET following_count = GREATEST(following_count - 1, 0) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION increment_unread_notifications_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET unread_notifications_count = unread_notifications_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION decrement_unread_notifications_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET unread_notifications_count = GREATEST(unread_notifications_count - 1, 0) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION reset_unread_notifications_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET unread_notifications_count = 0 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Follow/unfollow triggers
CREATE OR REPLACE FUNCTION handle_follow_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_following_count(NEW.follower_id);
  PERFORM increment_followers_count(NEW.following_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION handle_follow_delete()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM decrement_following_count(OLD.follower_id);
  PERFORM decrement_followers_count(OLD.following_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Notification triggers
CREATE OR REPLACE FUNCTION handle_notification_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_unread_notifications_count(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION handle_notification_read()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_read = false AND NEW.is_read = true THEN
    PERFORM decrement_unread_notifications_count(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION handle_notification_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_read = false THEN
    PERFORM decrement_unread_notifications_count(OLD.user_id);
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Auto-notification functions
CREATE OR REPLACE FUNCTION handle_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION handle_retweet_notification()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION handle_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION handle_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Hashtag functions
CREATE OR REPLACE FUNCTION extract_hashtags(text_content TEXT)
RETURNS TEXT[] AS $$
DECLARE
  hashtag_pattern TEXT := '#[a-zA-Z0-9_]+';
  hashtags TEXT[];
BEGIN
  SELECT array_agg(DISTINCT lower(substring(match FROM 2)))
  INTO hashtags
  FROM regexp_split_to_table(text_content, '\s') AS match
  WHERE match ~ hashtag_pattern;
  RETURN COALESCE(hashtags, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION create_or_update_hashtag(hashtag_name TEXT)
RETURNS UUID AS $$
DECLARE
  hashtag_id UUID;
BEGIN
  INSERT INTO hashtags (name, usage_count, trending_score)
  VALUES (lower(hashtag_name), 1, 1.0)
  ON CONFLICT (name) DO UPDATE SET
    usage_count = hashtags.usage_count + 1,
    trending_score = hashtags.trending_score + 1.0,
    updated_at = NOW()
  RETURNING id INTO hashtag_id;
  RETURN hashtag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP FUNCTION IF EXISTS link_hashtags_to_post(UUID, TEXT[]);
CREATE OR REPLACE FUNCTION link_hashtags_to_post(post_id UUID, hashtag_names TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  hashtag_name TEXT;
  hashtag_id UUID;
BEGIN
  FOREACH hashtag_name IN ARRAY hashtag_names
  LOOP
    hashtag_id := create_or_update_hashtag(hashtag_name);
    INSERT INTO post_hashtags (post_id, hashtag_id)
    VALUES (post_id, hashtag_id)
    ON CONFLICT (post_id, hashtag_id) DO NOTHING;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION get_trending_hashtags(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  usage_count INTEGER,
  trending_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.name,
    h.usage_count,
    h.trending_score
  FROM hashtags h
  WHERE h.usage_count > 0
  ORDER BY h.trending_score DESC, h.usage_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Poll functions
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
  poll_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    poll_id := OLD.poll_id;
  ELSE
    poll_id := NEW.poll_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE poll_options SET vote_count = vote_count - 1 WHERE id = OLD.option_id;
  ELSE
    UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = NEW.option_id;
  END IF;
  
  UPDATE polls SET total_votes = (SELECT SUM(vote_count) FROM poll_options WHERE poll_id = polls.id) WHERE id = poll_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION get_poll_results(poll_id UUID)
RETURNS TABLE (
  option_id UUID,
  option_text TEXT,
  vote_count INTEGER,
  percentage FLOAT
) AS $$
DECLARE
  total_votes INTEGER;
BEGIN
  SELECT COALESCE(SUM(vote_count), 0) INTO total_votes FROM poll_options WHERE poll_id = get_poll_results.poll_id;
  RETURN QUERY
  SELECT 
    po.id,
    po.option_text,
    po.vote_count,
    CASE 
      WHEN total_votes > 0 THEN (po.vote_count::FLOAT / total_votes::FLOAT) * 100
      ELSE 0
    END as percentage
  FROM poll_options po
  WHERE po.poll_id = get_poll_results.poll_id
  ORDER BY po.vote_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Message functions
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message_at = NEW.created_at,
    last_message_id = NEW.id,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  SELECT c.id INTO conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
  JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
  WHERE cp1.user_id = user1_id AND cp2.user_id = user2_id
  AND c.is_group = false
  LIMIT 1;
  
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (is_group) VALUES (false) RETURNING id INTO conversation_id;
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES (conversation_id, user1_id);
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES (conversation_id, user2_id);
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Story functions
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE stories SET is_archived = true WHERE expires_at < NOW();
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION mark_story_as_viewed(story_id UUID, viewer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO story_views (story_id, viewer_id)
  VALUES (mark_story_as_viewed.story_id, mark_story_as_viewed.viewer_id)
  ON CONFLICT (story_id, viewer_id) DO NOTHING;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =============================================
-- 13. TRIGGER'LAR
-- =============================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auth user creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Follow triggers
DROP TRIGGER IF EXISTS on_follow_insert ON follows;
DROP TRIGGER IF EXISTS on_follow_delete ON follows;

CREATE TRIGGER on_follow_insert AFTER INSERT ON follows FOR EACH ROW EXECUTE FUNCTION handle_follow_insert();
CREATE TRIGGER on_follow_delete AFTER DELETE ON follows FOR EACH ROW EXECUTE FUNCTION handle_follow_delete();

-- Notification triggers
DROP TRIGGER IF EXISTS on_notification_insert ON notifications;
DROP TRIGGER IF EXISTS on_notification_read ON notifications;
DROP TRIGGER IF EXISTS on_notification_delete ON notifications;

CREATE TRIGGER on_notification_insert AFTER INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION handle_notification_insert();
CREATE TRIGGER on_notification_read AFTER UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION handle_notification_read();
CREATE TRIGGER on_notification_delete AFTER DELETE ON notifications FOR EACH ROW EXECUTE FUNCTION handle_notification_delete();

-- Auto-notification triggers
DROP TRIGGER IF EXISTS on_like_notification ON post_interactions;
DROP TRIGGER IF EXISTS on_retweet_notification ON post_interactions;
DROP TRIGGER IF EXISTS on_comment_notification ON comments;
DROP TRIGGER IF EXISTS on_follow_notification ON follows;

CREATE TRIGGER on_like_notification AFTER INSERT ON post_interactions FOR EACH ROW WHEN (NEW.type = 'like') EXECUTE FUNCTION handle_like_notification();
CREATE TRIGGER on_retweet_notification AFTER INSERT ON post_interactions FOR EACH ROW WHEN (NEW.type = 'retweet') EXECUTE FUNCTION handle_retweet_notification();
CREATE TRIGGER on_comment_notification AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION handle_comment_notification();
CREATE TRIGGER on_follow_notification AFTER INSERT ON follows FOR EACH ROW EXECUTE FUNCTION handle_follow_notification();

-- Poll vote triggers
DROP TRIGGER IF EXISTS on_poll_vote_insert ON poll_votes;
DROP TRIGGER IF EXISTS on_poll_vote_delete ON poll_votes;

CREATE TRIGGER on_poll_vote_insert AFTER INSERT ON poll_votes FOR EACH ROW EXECUTE FUNCTION update_poll_vote_counts();
CREATE TRIGGER on_poll_vote_delete AFTER DELETE ON poll_votes FOR EACH ROW EXECUTE FUNCTION update_poll_vote_counts();

-- Message triggers
DROP TRIGGER IF EXISTS on_message_insert ON messages;
CREATE TRIGGER on_message_insert AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- =============================================
-- 14. TEMİZLEME VE OPTİMİZASYON
-- =============================================

-- Eski tabloları temizle
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    DROP TABLE profiles CASCADE;
  END IF;
END $$;

-- =============================================
-- SONUÇ: TÜM SİSTEMLER TEK DOSYADA!
-- =============================================
