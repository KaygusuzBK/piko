import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'

export function NotificationButton() {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="hidden sm:flex h-10 w-10 transition-all duration-200 hover:scale-110"
    >
      <Bell className="h-5 w-5 transition-transform duration-200 hover:rotate-12" />
      <span className="sr-only">Bildirimler</span>
    </Button>
  )
}

