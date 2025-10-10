-- Piko Sosyal Medya Uygulaması - Birleştirilmiş Şema
-- Users ve profiles tabloları birleştirildi

-- 1. Users tablosunu genişletme (mevcut users tablosuna ek kolonlar)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

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
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
  retweets_count INTEGER DEFAULT 0 CHECK (retweets_count >= 0)
);

-- 4. Post interactions tablosu (beğeni, retweet, bookmark)
CREATE TABLE IF NOT EXISTS post_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'retweet', 'bookmark')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id, type)
);

-- 5. Indexler
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_interactions_user_id ON post_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_interactions_post_id ON post_interactions(post_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON public.users(username) WHERE username IS NOT NULL;

-- 5.1 Storage buckets for user images
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'banners') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
  END IF;
END $$;

-- 6. RLS (Row Level Security) politikaları
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;

-- Storage RLS
-- storage.objects zaten RLS açık; yeniden açmaya çalışmak owner yetkisi ister ve hata verir
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Reset existing storage policies for our buckets
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Public read banners" ON storage.objects;
  DROP POLICY IF EXISTS "Users manage own avatar objects" ON storage.objects;
  DROP POLICY IF EXISTS "Users manage own banner objects" ON storage.objects;
END $$;

-- Public read for avatars and banners
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Public read banners" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'banners');

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

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();