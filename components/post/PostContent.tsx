interface PostContentProps {
  content: string
}

export function PostContent({ content }: PostContentProps) {
  return (
    <div className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed text-foreground dark:text-white">
      {content}
    </div>
  )
}

