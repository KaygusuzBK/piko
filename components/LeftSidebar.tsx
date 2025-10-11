'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Home as HomeIcon, 
  Search, 
  Bell, 
  Mail, 
  Star, 
  User, 
  Settings,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

interface LeftSidebarProps {
  hideExtras?: boolean
}

export function LeftSidebar({ hideExtras = false }: LeftSidebarProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  return (
    <div className={`hidden lg:block lg:col-span-1`}>
      <div className="sticky top-0 h-screen overflow-y-auto scrollbar-hide space-y-4">
        {
          <Card className="border-none bg-transparent shadow-none">
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                <Button onClick={() => router.push('/')} variant="ghost" className="w-full justify-start text-foreground hover:text-white hover:bg-piko-gradient transition-all duration-200 hover:scale-105">
                  <HomeIcon className="mr-3 h-5 w-5 transition-transform duration-200 hover:rotate-12" />
                  <span className="text-sm sm:text-base">Ana Sayfa</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-foreground hover:text-white hover:bg-piko-gradient transition-all duration-200 hover:scale-105">
                  <Search className="mr-3 h-5 w-5 transition-transform duration-200 hover:rotate-12" />
                  <span className="text-sm sm:text-base">Keşfet</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-foreground hover:text-white hover:bg-piko-gradient transition-all duration-200 hover:scale-105">
                  <Bell className="mr-3 h-5 w-5 transition-transform duration-200 hover:rotate-12" />
                  <span className="text-sm sm:text-base">Bildirimler</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-foreground hover:text-white hover:bg-piko-gradient transition-all duration-200 hover:scale-105">
                  <Mail className="mr-3 h-5 w-5 transition-transform duration-200 hover:rotate-12" />
                  <span className="text-sm sm:text-base">Mesajlar</span>
                </Button>
                <Button onClick={() => router.push('/favorites')} variant="ghost" className="w-full justify-start text-foreground hover:text-white hover:bg-piko-gradient transition-all duration-200 hover:scale-105">
                  <Star className="mr-3 h-5 w-5 transition-transform duration-200 hover:rotate-12" />
                  <span className="text-sm sm:text-base">Favoriler</span>
                </Button>
                <Button onClick={() => user?.id && router.push(`/users/${user.id}`)} variant="ghost" className="w-full justify-start text-foreground hover:text-white hover:bg-piko-gradient transition-all duration-200 hover:scale-105">
                  <User className="mr-3 h-5 w-5 transition-transform duration-200 hover:rotate-12" />
                  <span className="text-sm sm:text-base">Profil</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-foreground hover:text-foreground hover:bg-accent transition-all duration-200 hover:scale-105">
                  <Settings className="mr-3 h-5 w-5 transition-transform duration-200 hover:rotate-12" />
                  <span className="text-sm sm:text-base">Ayarlar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        }

        {!hideExtras && (
          <>
            <Card className="border-none bg-transparent shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-foreground">Trending</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Henüz trending konu yok</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-transparent shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-foreground">Önerilen Kullanıcılar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Henüz önerilen kullanıcı yok</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}


