import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BellRing, Inbox } from 'lucide-react'
import { auditApi } from '@/shared/api/endpoints'
import { useNavigation } from '@/shared/permissions/hooks'
import { grantedScreens } from '@/shared/navigation/businessNav'
import { Avatar, IconButton } from '@/shared/ui/primitives'
import { EmptyState } from '@/shared/ui/feedback'
import { describeActivity, relativeTime } from '@/shared/activity'

/**
 * Notifications are real events, not decoration: the workspace activity feed, phrased as sentences.
 * People who cannot read the activity log see an honest empty state rather than a fake badge.
 */
export function NotificationMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: navigation } = useNavigation()
  const canReadActivity = grantedScreens(navigation).has('AUDIT_LOG_LIST')

  const { data } = useQuery({
    queryKey: ['activity-preview'],
    queryFn: () => auditApi.logs({ size: 6 }),
    enabled: canReadActivity && open,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  const items = data?.content ?? []

  return (
    <div ref={ref} className="relative">
      <IconButton
        icon={BellRing}
        label="Thông báo"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        data-testid="notifications"
      />
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-80 rounded-card border border-line bg-surface shadow-lift animate-rise-in">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">Thông báo</h2>
            {canReadActivity && (
              <Link to="/activity" onClick={() => setOpen(false)} className="text-xs text-brand-600 hover:underline">
                Xem tất cả
              </Link>
            )}
          </header>

          {!canReadActivity && (
            <EmptyState compact icon={Inbox} title="Không có thông báo mới" description="Khi có việc cần bạn xử lý, thông báo sẽ hiện ở đây." />
          )}

          {canReadActivity && items.length === 0 && (
            <EmptyState compact icon={Inbox} title="Chưa có hoạt động nào" description="Hoạt động của workspace sẽ xuất hiện tại đây." />
          )}

          <ul className="max-h-80 overflow-y-auto">
            {items.map((row) => (
              <li key={row.id} className="flex gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <Avatar name={row.username ?? 'Hệ thống'} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm text-ink-secondary">{describeActivity(row)}</p>
                  <p className="mt-0.5 text-xs text-ink-subtle">{relativeTime(row.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
