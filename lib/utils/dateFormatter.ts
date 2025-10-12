export function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const postDate = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000)

  if (diffInSeconds < 60) return 'şimdi'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}dk`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}sa`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}g`
  
  return postDate.toLocaleDateString('tr-TR')
}

