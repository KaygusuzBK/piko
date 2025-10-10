'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Sparkles } from 'lucide-react'

export function RightSidebar() {
  return (
    <div className="hidden md:block lg:col-span-1">
      <div className="sticky top-20 space-y-4 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg text-foreground">Kimleri Takip Ediyorsun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Henüz kimseyi takip etmiyorsun</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center space-y-2">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground" />
              <h3 className="font-semibold text-sm sm:text-base text-foreground">Daha fazla kişi keşfet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Arkadaşlarını bul ve takip etmeye başla
              </p>
              <Button className="w-full text-xs sm:text-sm h-8 sm:h-9 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 transition-transform duration-200 hover:rotate-12" />
                Keşfet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


