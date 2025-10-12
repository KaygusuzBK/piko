interface ProfileTabsProps {
  activeTab: 'posts' | 'replies' | 'media' | 'likes' | 'favorites'
  onTabChange: (tab: 'posts' | 'replies' | 'media' | 'likes' | 'favorites') => void
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const tabs = [
    { id: 'posts' as const, label: 'SOC-AI\'lar' },
    { id: 'replies' as const, label: 'Yanıtlar' },
    { id: 'media' as const, label: 'Medya' },
    { id: 'likes' as const, label: 'Beğeniler' },
    { id: 'favorites' as const, label: 'Favoriler' }
  ]

  return (
    <nav className="flex">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`w-full py-4 font-semibold transition border-b-2 ${
            activeTab === tab.id
              ? 'text-foreground border-primary'
              : 'text-muted-foreground hover:bg-accent border-transparent'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

