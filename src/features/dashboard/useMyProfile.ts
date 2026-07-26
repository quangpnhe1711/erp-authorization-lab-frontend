import { useQuery } from '@tanstack/react-query'
import { employeeApi } from '@/shared/api/endpoints'
import { useAuth } from '@/shared/auth/AuthProvider'
import { SCREENS } from '@/shared/permissions/screens'

export interface MyProfile {
  fullName?: string
  jobTitle?: string
  department?: string
  team?: string
  employeeCode?: string
  /** True when the profile loaded and a contact field the person can see is still blank. */
  hasContactGap: boolean
  isLoading: boolean
}

/**
 * The signed-in person's own record: the greeting, the avatar and the account menu all read from
 * here. Some roles cannot read their own organisation fields, so every value is optional and the
 * UI shows the parts it did receive instead of empty rows.
 */
export function useMyProfile(): MyProfile {
  const { me } = useAuth()
  const employeeId = me?.employeeId ?? null

  const { data, isLoading } = useQuery({
    queryKey: ['my-profile', employeeId],
    queryFn: () => employeeApi.detail(SCREENS.MY_PROFILE, employeeId!),
    enabled: employeeId != null,
    staleTime: 120_000,
    retry: false,
  })

  const fields = data?.fields ?? {}
  const text = (key: string): string | undefined => {
    const value = fields[key]
    return typeof value === 'string' && value.trim() !== '' ? value : undefined
  }

  // A field is only "missing" if it came back at all — an absent key means the person may not read it.
  const blank = (key: string) => key in fields && !text(key)

  return {
    fullName: text('fullName'),
    jobTitle: text('jobTitle'),
    department: text('department'),
    team: text('team'),
    employeeCode: text('employeeCode'),
    hasContactGap: Boolean(data) && (blank('phoneNumber') || blank('personalEmail')),
    isLoading,
  }
}
