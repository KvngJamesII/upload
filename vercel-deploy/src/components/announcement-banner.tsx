import { useQuery } from "@tanstack/react-query";
import type { Announcement } from "@shared/schema";

export function AnnouncementBanner() {
  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const activeAnnouncements = announcements?.filter((a) => a.isActive) || [];

  if (activeAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="relative h-12 overflow-hidden border-b bg-primary/5">
      <div className="absolute inset-0 flex items-center whitespace-nowrap">
        <div className="animate-marquee inline-flex items-center px-4">
          {activeAnnouncements.map((announcement, index) => (
            <span key={announcement.id} className="inline-flex items-center text-sm font-medium">
              {announcement.content}
              {index < activeAnnouncements.length - 1 && (
                <span className="mx-8 inline-block h-1 w-1 rounded-full bg-foreground/40" />
              )}
            </span>
          ))}
        </div>
        <div className="animate-marquee2 inline-flex items-center px-4">
          {activeAnnouncements.map((announcement, index) => (
            <span key={announcement.id} className="inline-flex items-center text-sm font-medium">
              {announcement.content}
              {index < activeAnnouncements.length - 1 && (
                <span className="mx-8 inline-block h-1 w-1 rounded-full bg-foreground/40" />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
