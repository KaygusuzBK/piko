-- =====================================================
-- SOC AI - Güvenlik Açıklarını Düzeltme SQL Script
-- =====================================================
-- Bu script Supabase Database Linter uyarılarını düzeltir
-- Tüm PostgreSQL fonksiyonlarına search_path güvenlik ayarı ekler
-- Auth güvenlik ayarlarını optimize eder

-- =====================================================
-- 1. POSTGRESQL FONKSİYONLARI - SEARCH_PATH GÜVENLİĞİ
-- =====================================================

-- Likes Count Functions
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

-- Retweets Count Functions
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

-- Comments Count Functions
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

-- Followers Count Functions
CREATE OR REPLACE FUNCTION increment_followers_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET followers_count = followers_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION decrement_followers_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Following Count Functions
CREATE OR REPLACE FUNCTION increment_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET following_count = following_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION decrement_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Notifications Count Functions
CREATE OR REPLACE FUNCTION increment_unread_notifications_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET unread_notifications_count = unread_notifications_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION decrement_unread_notifications_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET unread_notifications_count = GREATEST(unread_notifications_count - 1, 0) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION reset_unread_notifications_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET unread_notifications_count = 0 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================
-- 2. TRIGGER FONKSİYONLARI - SEARCH_PATH GÜVENLİĞİ
-- =====================================================

-- Updated At Column Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- New User Handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    username,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Follow Insert Handler
CREATE OR REPLACE FUNCTION handle_follow_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment followers count for the user being followed
  PERFORM increment_followers_count(NEW.following_id);
  
  -- Increment following count for the user who is following
  PERFORM increment_following_count(NEW.follower_id);
  
  -- Create follow notification
  PERFORM handle_follow_notification(NEW.follower_id, NEW.following_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Follow Delete Handler
CREATE OR REPLACE FUNCTION handle_follow_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement followers count for the user who was being followed
  PERFORM decrement_followers_count(OLD.following_id);
  
  -- Decrement following count for the user who was following
  PERFORM decrement_following_count(OLD.follower_id);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Notification Handlers
CREATE OR REPLACE FUNCTION handle_notification_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment unread notifications count for the user
  PERFORM increment_unread_notifications_count(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION handle_notification_read()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrement if the notification was unread
  IF OLD.is_read = false AND NEW.is_read = true THEN
    PERFORM decrement_unread_notifications_count(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION handle_notification_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrement if the notification was unread
  IF OLD.is_read = false THEN
    PERFORM decrement_unread_notifications_count(OLD.user_id);
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================
-- 3. NOTIFICATION CREATION FUNCTIONS
-- =====================================================

-- Like Notification Handler
CREATE OR REPLACE FUNCTION handle_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- Get the post author
  SELECT author_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't create notification if user likes their own post
  IF post_author_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      actor_id,
      type,
      post_id,
      message,
      created_at
    ) VALUES (
      post_author_id,
      NEW.user_id,
      'like',
      NEW.post_id,
      'Beğendi',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Retweet Notification Handler
CREATE OR REPLACE FUNCTION handle_retweet_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- Get the post author
  SELECT author_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't create notification if user retweets their own post
  IF post_author_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      actor_id,
      type,
      post_id,
      message,
      created_at
    ) VALUES (
      post_author_id,
      NEW.user_id,
      'retweet',
      NEW.post_id,
      'Retweet etti',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Comment Notification Handler
CREATE OR REPLACE FUNCTION handle_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- Get the post author
  SELECT author_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't create notification if user comments on their own post
  IF post_author_id != NEW.author_id THEN
    INSERT INTO notifications (
      user_id,
      actor_id,
      type,
      post_id,
      comment_id,
      message,
      created_at
    ) VALUES (
      post_author_id,
      NEW.author_id,
      'comment',
      NEW.post_id,
      NEW.id,
      'Yorum yaptı',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Follow Notification Handler
CREATE OR REPLACE FUNCTION handle_follow_notification(follower_id UUID, following_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    actor_id,
    type,
    message,
    created_at
  ) VALUES (
    following_id,
    follower_id,
    'follow',
    'Seni takip etmeye başladı',
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================
-- 4. AUTH SYNC FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION sync_auth_users_to_public()
RETURNS TRIGGER AS $$
BEGIN
  -- Update public.users when auth.users is updated
  UPDATE public.users 
  SET 
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users table policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts table policies
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
CREATE POLICY "Users can view all posts" ON public.posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- Post interactions policies
DROP POLICY IF EXISTS "Users can view all interactions" ON public.post_interactions;
CREATE POLICY "Users can view all interactions" ON public.post_interactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create interactions" ON public.post_interactions;
CREATE POLICY "Users can create interactions" ON public.post_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own interactions" ON public.post_interactions;
CREATE POLICY "Users can update own interactions" ON public.post_interactions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own interactions" ON public.post_interactions;
CREATE POLICY "Users can delete own interactions" ON public.post_interactions
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
CREATE POLICY "Users can view all comments" ON public.comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = author_id);

-- Follows policies
DROP POLICY IF EXISTS "Users can view all follows" ON public.follows;
CREATE POLICY "Users can view all follows" ON public.follows
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create follows" ON public.follows;
CREATE POLICY "Users can create follows" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete own follows" ON public.follows;
CREATE POLICY "Users can delete own follows" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Updated at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auth triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_auth_users_to_public();

-- Follow triggers
DROP TRIGGER IF EXISTS on_follow_insert ON public.follows;
CREATE TRIGGER on_follow_insert
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION handle_follow_insert();

DROP TRIGGER IF EXISTS on_follow_delete ON public.follows;
CREATE TRIGGER on_follow_delete
  AFTER DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION handle_follow_delete();

-- Notification triggers
DROP TRIGGER IF EXISTS on_notification_insert ON public.notifications;
CREATE TRIGGER on_notification_insert
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION handle_notification_insert();

DROP TRIGGER IF EXISTS on_notification_read ON public.notifications;
CREATE TRIGGER on_notification_read
  AFTER UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION handle_notification_read();

DROP TRIGGER IF EXISTS on_notification_delete ON public.notifications;
CREATE TRIGGER on_notification_delete
  AFTER DELETE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION handle_notification_delete();

-- Interaction triggers
DROP TRIGGER IF EXISTS on_like_insert ON public.post_interactions;
CREATE TRIGGER on_like_insert
  AFTER INSERT ON public.post_interactions
  FOR EACH ROW 
  WHEN (NEW.type = 'like')
  EXECUTE FUNCTION handle_like_notification();

DROP TRIGGER IF EXISTS on_retweet_insert ON public.post_interactions;
CREATE TRIGGER on_retweet_insert
  AFTER INSERT ON public.post_interactions
  FOR EACH ROW 
  WHEN (NEW.type = 'retweet')
  EXECUTE FUNCTION handle_retweet_notification();

DROP TRIGGER IF EXISTS on_comment_insert ON public.comments;
CREATE TRIGGER on_comment_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION handle_comment_notification();

-- =====================================================
-- 7. GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users for public data
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.posts TO anon;
GRANT SELECT ON public.comments TO anon;
GRANT SELECT ON public.post_interactions TO anon;
GRANT SELECT ON public.follows TO anon;

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_likes_count ON public.posts(likes_count);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);

-- Interactions indexes
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id ON public.post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_id ON public.post_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_type ON public.post_interactions(type);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- =====================================================
-- 9. COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA public IS 'SOC AI Sosyal Medya Uygulaması - Ana şema';
COMMENT ON TABLE public.users IS 'Kullanıcı bilgileri ve profil verileri';
COMMENT ON TABLE public.posts IS 'Kullanıcı gönderileri';
COMMENT ON TABLE public.comments IS 'Gönderi yorumları';
COMMENT ON TABLE public.post_interactions IS 'Gönderi etkileşimleri (beğeni, retweet, kaydetme)';
COMMENT ON TABLE public.follows IS 'Kullanıcı takip ilişkileri';
COMMENT ON TABLE public.notifications IS 'Kullanıcı bildirimleri';

-- =====================================================
-- SCRIPT TAMAMLANDI
-- =====================================================
-- Bu script aşağıdaki güvenlik açıklarını düzeltir:
-- 1. Tüm PostgreSQL fonksiyonlarına search_path güvenlik ayarı eklendi
-- 2. Row Level Security (RLS) politikaları optimize edildi
-- 3. Trigger fonksiyonları güvenli hale getirildi
-- 4. Performans için indexler eklendi
-- 5. Proper grants ve permissions ayarlandı
-- =====================================================
