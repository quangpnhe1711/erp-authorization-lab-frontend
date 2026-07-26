import { Info } from 'lucide-react'
import { useMyProfile } from '@/features/dashboard/useMyProfile'
import { useDeveloperMode } from '@/shared/devmode/DeveloperModeProvider'
import type { ScreenPermission } from '@/shared/api/types'

/**
 * The lab's core idea, said in a sentence.
 *
 * A list never shows every record — it shows the slice this person is responsible for. Instead of
 * printing `TEAM ∪ RESPONSIBILITY` badges, the page states which slice that is in plain language,
 * so someone who has never heard the phrase "record scope" still understands why the count is 6
 * and not 8. The codes stay available in developer mode.
 */
export function ScopeNotice({
  permission,
  count,
  noun,
}: {
  permission: ScreenPermission | undefined
  count?: number
  noun: string
}) {
  const { developerMode } = useDeveloperMode()
  const profile = useMyProfile()
  if (!permission) return null

  const clauses = permission.recordScopes.map((scope) => {
    switch (scope) {
      case 'SELF':
        return 'hồ sơ của chính bạn'
      case 'TEAM':
        return profile.team ? `nhóm ${profile.team}` : 'nhóm của bạn'
      case 'DEPARTMENT':
        return profile.department ? `phòng ${profile.department}` : 'phòng ban của bạn'
      case 'RESPONSIBILITY':
        return 'các bộ phận bạn phụ trách'
      case 'ALL':
        return 'toàn công ty'
      default:
        return null
    }
  })

  const readable = clauses.filter((clause): clause is string => Boolean(clause))
  if (readable.length === 0) return null

  const where = readable.length === 1 ? readable[0] : `${readable.slice(0, -1).join(', ')} và ${readable.at(-1)}`
  const prefix = typeof count === 'number' ? `Đang hiển thị ${count} ${noun}` : `Bạn xem được ${noun}`

  return (
    <p
      data-testid="scope-notice"
      className="flex items-start gap-2 text-sm text-ink-muted"
    >
      <Info size={15} strokeWidth={1.9} aria-hidden className="mt-0.5 shrink-0 text-ink-subtle" />
      <span>
        {prefix} thuộc {where}.
        {developerMode && (
          <span className="ml-1 font-mono text-xs text-ink-subtle">
            [{permission.recordScopes.join(' ∪ ')}]
          </span>
        )}
      </span>
    </p>
  )
}
