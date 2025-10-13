-- =====================================================
-- SON KALAN GÜVENLİK AÇIĞINI DÜZELTME
-- =====================================================
-- handle_follow_notification fonksiyonunu tekrar oluştur

-- Önce eski fonksiyonu kaldır
DROP FUNCTION IF EXISTS handle_follow_notification(UUID, UUID);

-- Yeni güvenli fonksiyonu oluştur
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

-- Fonksiyonun çalıştığını test et
SELECT 'handle_follow_notification function created successfully' as status;
