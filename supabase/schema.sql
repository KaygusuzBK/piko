-- SOC AI Sosyal Medya Uygulaması - Birleştirilmiş Şema
-- Users ve profiles tabloları birleştirildi

-- 1. Users tablosunu genişletme (mevcut users tablosuna ek kolonlar)
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
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Eğer profiles tablosu varsa, verilerini users tablosuna taşı ve kaldır
-- Önce profiles tablosunun var olup olmadığını kontrol et
DO $$
BEGIN
  -- Profiles tablosu varsa verileri taşı
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

    -- Posts tablosundaki foreign key'i güncelle (profiles -> users)
    ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
    ALTER TABLE posts ADD CONSTRAINT posts_author_id_fkey 
      FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;

    -- Post_interactions tablosundaki foreign key'i güncelle (profiles -> users)
    ALTER TABLE post_interactions DROP CONSTRAINT IF EXISTS post_interactions_user_id_fkey;
    ALTER TABLE post_interactions ADD CONSTRAINT post_interactions_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

    -- Profiles tablosunu kaldır
    DROP TABLE profiles CASCADE;
  END IF;
END $$;

-- 3. Posts tablosu oluşturma (users tablosuna referans)
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

-- Migrate existing image_url to image_urls array (for existing tables)
DO $$
BEGIN
  -- Add image_urls column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE posts ADD COLUMN image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
    
    -- Migrate existing image_url data to image_urls array
    UPDATE posts 
    SET image_urls = ARRAY[image_url]::TEXT[]
    WHERE image_url IS NOT NULL AND image_url != '';
    
    -- Drop old image_url column
    ALTER TABLE posts DROP COLUMN IF EXISTS image_url;
  END IF;
  
  -- Add type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'type'
  ) THEN
    ALTER TABLE posts ADD COLUMN type TEXT DEFAULT 'text' CHECK (type IN ('text', 'media'));
  END IF;
END $$;

-- 4. Post interactions tablosu (beğeni, retweet, bookmark)
CREATE TABLE IF NOT EXISTS post_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'retweet', 'bookmark')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id, type)
);

-- 4.1. Comments tablosu (yorumlar)
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.2. Follows tablosu (takip sistemi)
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 5. Indexler
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_author_type ON posts(author_id, type);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_id ON post_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id ON post_interactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_type ON post_interactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_following ON follows(follower_id, following_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON public.users(username) WHERE username IS NOT NULL;

-- 5.1 Storage buckets for user images and post images
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

-- 6. RLS (Row Level Security) politikaları
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Storage RLS
-- storage.objects zaten RLS açık; yeniden açmaya çalışmak owner yetkisi ister ve hata verir
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Reset existing storage policies for our buckets
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Public read banners" ON storage.objects;
  DROP POLICY IF EXISTS "Public read post images" ON storage.objects;
  DROP POLICY IF EXISTS "Users manage own avatar objects" ON storage.objects;
  DROP POLICY IF EXISTS "Users manage own banner objects" ON storage.objects;
  DROP POLICY IF EXISTS "Users manage own post images" ON storage.objects;
END $$;

-- Public read for avatars, banners and post images
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Public read banners" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'banners');

CREATE POLICY "Public read post images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'post-images');

-- Helpers: users can write only to their own folder: <uid>/...
-- This uses split_part(name,'/',1) to compare the folder prefix
CREATE POLICY "Users manage own avatar objects" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "Users manage own banner objects" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'banners' AND split_part(name, '/', 1) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'banners' AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "Users manage own post images" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'post-images' AND split_part(name, '/', 1) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'post-images' AND split_part(name, '/', 1) = auth.uid()::text
  );

-- Eski profiles politikalarını kaldır (eğer varsa)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  END IF;
END $$;

-- Users politikaları
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts politikaları
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Post interactions politikaları
DROP POLICY IF EXISTS "Post interactions are viewable by everyone" ON post_interactions;
DROP POLICY IF EXISTS "Users can create their own interactions" ON post_interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON post_interactions;

CREATE POLICY "Post interactions are viewable by everyone" ON post_interactions FOR SELECT USING (true);
CREATE POLICY "Users can create their own interactions" ON post_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interactions" ON post_interactions FOR DELETE USING (auth.uid() = user_id);

-- Comments politikaları
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = author_id);

-- Follows politikaları
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow others" ON follows;

CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- 7. Functions for updating counts
CREATE OR REPLACE FUNCTION increment_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_likes_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_retweets_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET retweets_count = retweets_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_retweets_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET retweets_count = GREATEST(retweets_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_comments_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_comments_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Follower count functions
CREATE OR REPLACE FUNCTION increment_followers_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET followers_count = followers_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_followers_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET following_count = following_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET following_count = GREATEST(following_count - 1, 0) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eski profiles trigger'ını kaldır (eğer varsa)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
  END IF;
END $$;

-- Yeni trigger'ları oluştur
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Auto-create user profile on signup
-- When a new user signs up via Supabase Auth, automatically create a row in public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NULL, -- username will be set later by user
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Triggers for follow/unfollow counts
-- When someone follows a user, increment both follower and following counts
CREATE OR REPLACE FUNCTION handle_follow_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment following_count of the follower
  PERFORM increment_following_count(NEW.follower_id);
  -- Increment followers_count of the followed user
  PERFORM increment_followers_count(NEW.following_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- When someone unfollows a user, decrement both follower and following counts
CREATE OR REPLACE FUNCTION handle_follow_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement following_count of the follower
  PERFORM decrement_following_count(OLD.follower_id);
  -- Decrement followers_count of the followed user
  PERFORM decrement_followers_count(OLD.following_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_follow_insert ON follows;
CREATE TRIGGER on_follow_insert
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION handle_follow_insert();

DROP TRIGGER IF EXISTS on_follow_delete ON follows;
CREATE TRIGGER on_follow_delete
  AFTER DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION handle_follow_delete();

-- 11. Notifications System
-- 11.1 Add notification-related columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS unread_notifications_count INTEGER DEFAULT 0 CHECK (unread_notifications_count >= 0),
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"like": true, "comment": true, "retweet": true, "follow": true, "mention": true, "reply": true, "weekly_summary": true}';

-- 11.2 Notifications table
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

-- 11.3 Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);

-- 11.4 Push subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- 11.5 RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON notifications 
  FOR DELETE USING (auth.uid() = user_id);

-- System can insert notifications
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions 
  FOR ALL USING (auth.uid() = user_id);

-- 11.6 Functions for notification counts
CREATE OR REPLACE FUNCTION increment_unread_notifications_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET unread_notifications_count = unread_notifications_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_unread_notifications_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET unread_notifications_count = GREATEST(unread_notifications_count - 1, 0) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reset_unread_notifications_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users SET unread_notifications_count = 0 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11.7 Triggers for notification counts
CREATE OR REPLACE FUNCTION handle_notification_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment unread count for the user
  PERFORM increment_unread_notifications_count(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_notification_read()
RETURNS TRIGGER AS $$
BEGIN
  -- When a notification is marked as read, decrement the count
  IF OLD.is_read = false AND NEW.is_read = true THEN
    PERFORM decrement_unread_notifications_count(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_notification_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- When an unread notification is deleted, decrement the count
  IF OLD.is_read = false THEN
    PERFORM decrement_unread_notifications_count(OLD.user_id);
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_notification_insert ON notifications;
CREATE TRIGGER on_notification_insert
  AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION handle_notification_insert();

DROP TRIGGER IF EXISTS on_notification_read ON notifications;
CREATE TRIGGER on_notification_read
  AFTER UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION handle_notification_read();

DROP TRIGGER IF EXISTS on_notification_delete ON notifications;
CREATE TRIGGER on_notification_delete
  AFTER DELETE ON notifications
  FOR EACH ROW EXECUTE FUNCTION handle_notification_delete();

-- 11.8 Auto-create notifications on interactions
-- When someone likes a post
CREATE OR REPLACE FUNCTION handle_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
  actor_username TEXT;
BEGIN
  -- Get post author
  SELECT author_id INTO post_author FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user likes their own post
  IF post_author != NEW.user_id THEN
    -- Get actor username
    SELECT username INTO actor_username FROM public.users WHERE id = NEW.user_id;
    
    -- Create notification
    INSERT INTO notifications (user_id, type, actor_id, post_id, message)
    VALUES (
      post_author,
      'like',
      NEW.user_id,
      NEW.post_id,
      COALESCE(actor_username, 'Birisi') || ' gönderini beğendi'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- When someone retweets a post
CREATE OR REPLACE FUNCTION handle_retweet_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
  actor_username TEXT;
BEGIN
  -- Get post author
  SELECT author_id INTO post_author FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user retweets their own post
  IF post_author != NEW.user_id THEN
    -- Get actor username
    SELECT username INTO actor_username FROM public.users WHERE id = NEW.user_id;
    
    -- Create notification
    INSERT INTO notifications (user_id, type, actor_id, post_id, message)
    VALUES (
      post_author,
      'retweet',
      NEW.user_id,
      NEW.post_id,
      COALESCE(actor_username, 'Birisi') || ' gönderini retweetledi'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- When someone comments on a post
CREATE OR REPLACE FUNCTION handle_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
  actor_username TEXT;
BEGIN
  -- Get post author
  SELECT author_id INTO post_author FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user comments on their own post
  IF post_author != NEW.author_id THEN
    -- Get actor username
    SELECT username INTO actor_username FROM public.users WHERE id = NEW.author_id;
    
    -- Create notification
    INSERT INTO notifications (user_id, type, actor_id, post_id, comment_id, message)
    VALUES (
      post_author,
      'comment',
      NEW.author_id,
      NEW.post_id,
      NEW.id,
      COALESCE(actor_username, 'Birisi') || ' gönderine yorum yaptı'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- When someone follows another user
CREATE OR REPLACE FUNCTION handle_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_username TEXT;
BEGIN
  -- Get follower username
  SELECT username INTO follower_username FROM public.users WHERE id = NEW.follower_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, actor_id, message)
  VALUES (
    NEW.following_id,
    'follow',
    NEW.follower_id,
    COALESCE(follower_username, 'Birisi') || ' seni takip etmeye başladı'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for auto-notifications
DROP TRIGGER IF EXISTS on_like_notification ON post_interactions;
CREATE TRIGGER on_like_notification
  AFTER INSERT ON post_interactions
  FOR EACH ROW
  WHEN (NEW.type = 'like')
  EXECUTE FUNCTION handle_like_notification();

DROP TRIGGER IF EXISTS on_retweet_notification ON post_interactions;
CREATE TRIGGER on_retweet_notification
  AFTER INSERT ON post_interactions
  FOR EACH ROW
  WHEN (NEW.type = 'retweet')
  EXECUTE FUNCTION handle_retweet_notification();

DROP TRIGGER IF EXISTS on_comment_notification ON comments;
CREATE TRIGGER on_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION handle_comment_notification();

DROP TRIGGER IF EXISTS on_follow_notification ON follows;
CREATE TRIGGER on_follow_notification
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION handle_follow_notification();