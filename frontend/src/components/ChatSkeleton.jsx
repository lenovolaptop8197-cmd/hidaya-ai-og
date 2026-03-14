// Skeleton Loader with Emerald Green Shimmer Effect
// Used while AI is generating responses

export default function ChatSkeleton() {
  return (
    <article
      className="max-w-[85%] rounded-2xl rounded-bl-md border border-[#23B574]/10 bg-white px-4 py-3 text-sm shadow-sm animate-fade-in"
      data-testid="chat-skeleton"
    >
      <div className="space-y-3">
        {/* Skeleton Line 1 - Full width */}
        <div className="h-4 bg-gradient-to-r from-gray-200 via-[#50C878]/20 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
        
        {/* Skeleton Line 2 - 90% width */}
        <div className="h-4 bg-gradient-to-r from-gray-200 via-[#50C878]/20 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-[90%]"></div>
        
        {/* Skeleton Line 3 - 95% width */}
        <div className="h-4 bg-gradient-to-r from-gray-200 via-[#50C878]/20 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-[95%]"></div>
        
        {/* Skeleton Line 4 - 85% width */}
        <div className="h-4 bg-gradient-to-r from-gray-200 via-[#50C878]/20 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-[85%]"></div>
      </div>
    </article>
  );
}
