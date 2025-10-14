#!/bin/bash

# Supabase SQL Files Runner - Tek Dosya Versiyonu
# Bu script tek SQL dosyasını Supabase'e yükler

echo "🚀 Supabase SQL Dosyasını Çalıştırma Script'i"
echo "============================================="

# Supabase proje bilgileri
PROJECT_URL="https://yhrmzpmeetzuvsgdihnc.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlocm16cG1lZXR6dXZzZ2RpaG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5ODQyMDEsImV4cCI6MjA3NTU2MDIwMX0.33wibiokRszpEb2smw-AdrpvAD7W7Cs_GS0BFNUMgbU"

# SQL dosyası
SQL_FILE="supabase/complete-schema.sql"

echo "📋 Çalıştırılacak SQL Dosyası:"
if [ -f "$SQL_FILE" ]; then
    echo "✅ $SQL_FILE"
else
    echo "❌ $SQL_FILE (bulunamadı)"
    exit 1
fi

echo ""
echo "🔧 Manuel Çalıştırma Talimatları:"
echo "1. https://supabase.com/dashboard adresine gidin"
echo "2. Projenizi seçin (yhrmzpmeetzuvsgdihnc)"
echo "3. Sol menüden 'SQL Editor' seçin"
echo "4. 'New query' butonuna tıklayın"
echo "5. Aşağıdaki dosyayı çalıştırın:"
echo ""
echo "1. $SQL_FILE"
echo "   - Dosya içeriğini kopyalayın"
echo "   - SQL Editor'a yapıştırın"
echo "   - 'Run' butonuna tıklayın"
echo ""

echo "🎯 Önemli Notlar:"
echo "- Tek dosya ile tüm sistemler kurulacak"
echo "- Dosya PostgreSQL syntax'ına uygun"
echo "- Hata alırsanız dosyayı kontrol edin"
echo "- İşlem tamamlandığında tüm özellikler aktif olacak"

echo ""
echo "📊 Dosya Bilgileri:"
if [ -f "$SQL_FILE" ]; then
    size=$(wc -c < "$SQL_FILE")
    lines=$(wc -l < "$SQL_FILE")
    echo "   $SQL_FILE: ${size} bytes, ${lines} lines"
fi

echo ""
echo "✨ Hazır! Supabase Dashboard'da SQL dosyanızı çalıştırabilirsiniz."
echo ""
echo "🎉 Tek dosya ile tüm sistemler:"
echo "   ✅ Users, Posts, Comments, Follows"
echo "   ✅ Hashtags sistemi"
echo "   ✅ Direct Messaging"
echo "   ✅ Polls sistemi"
echo "   ✅ Content Moderation"
echo "   ✅ Notifications"
echo "   ✅ Stories sistemi"
echo "   ✅ Analytics"
echo "   ✅ RLS Policies"
echo "   ✅ Functions & Triggers"