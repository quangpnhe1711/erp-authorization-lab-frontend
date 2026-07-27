import { useMemo, useState } from 'react'
import { Check, Copy, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { useAdminMetadata } from './hooks'
import { Badge, Button, Card, CardHeader, Label, PageHeader, Select } from '@/shared/ui/primitives'
import { ErrorState } from '@/shared/ui/feedback'

/** A deterministic lab explorer for the seeded multi-role phone_number scenario. */
export function EffectivePermissionExplorer() {
  const { screen } = useActiveScreen()
  const metadata = useAdminMetadata(screen)
  const [userId, setUserId] = useState('')
  const [field, setField] = useState('phone_number')
  const [copied, setCopied] = useState(false)
  const users = metadata.data?.users ?? []
  const selected = users.find((user) => String(user.id) === userId) ?? users[0]
  const roles = selected?.roles.filter((role) => role.active).map((role) => role.roleCode) ?? []
  const result = useMemo(() => ({
    canEnter: true,
    effectiveRecordScopes: { read: ['ALL'], update: ['SELF'], unmask: ['SELF'] },
    field: {
      [field]: {
        read: { allowed: true, matchedScope: 'ALL' },
        update: { allowed: false, requiredScope: 'SELF' },
        unmask: { allowed: false, requiredScope: 'SELF' },
        returnedValuePolicy: 'MASKED',
        sources: roles.length ? roles : ['HR_OFFICER'],
      },
    },
  }), [field, roles])
  const json = JSON.stringify(result, null, 2)

  if (metadata.error) return <ErrorState error={metadata.error} />
  return (
    <>
      <PageHeader title="Kiểm tra quyền hiệu lực" description="Theo dõi quyền cuối cùng và nguồn cấp quyền của một user trên một màn hình." />
      <Card className="mb-5 grid gap-4 md:grid-cols-3">
        <div><Label htmlFor="explorer-user">Người dùng</Label><Select id="explorer-user" value={userId || String(selected?.id ?? '')} onChange={(e) => setUserId(e.target.value)}>
          {users.map((user) => <option key={user.id} value={user.id}>{user.employeeName ?? user.username}</option>)}
        </Select></div>
        <div><Label htmlFor="explorer-screen">Màn hình</Label><Select id="explorer-screen" defaultValue="HRM_EMPLOYEE_DETAIL"><option>Hồ sơ nhân viên</option></Select></div>
        <div><Label htmlFor="explorer-field">Field</Label><Select id="explorer-field" value={field} onChange={(e) => setField(e.target.value)}><option>phone_number</option><option>personal_email</option><option>base_salary</option></Select></div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader title="Kết quả cuối cùng" description="Resolver hợp quyền theo từng action, không lan Read sang Update hoặc Unmask." icon={ShieldCheck} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Result label="Được vào màn" allowed={result.canEnter} />
            <Result label="Được xem" allowed={true} scope="ALL" />
            <Result label="Được sửa" allowed={false} scope="SELF" />
            <Result label="Được xem thật" allowed={false} scope="SELF" />
          </div>
          <div className="mt-5 rounded-control bg-canvas p-4"><p className="text-xs text-ink-subtle">Giá trị trả về</p><p className="mt-1 font-mono text-lg font-semibold">***</p></div>
        </Card>
        <Card>
          <CardHeader title="Nguồn quyền" description="Các role và group đóng góp vào kết quả." icon={ShieldAlert} />
          <div className="space-y-3 text-sm">
            {['Read / all ← HR_OFFICER / EMPLOYEE_SUMMARY', 'Update / self ← HR_OFFICER / EMPLOYEE_CONTACT', 'Unmask / self ← HR_OFFICER / EMPLOYEE_CONTACT'].map((source) => <div key={source} className="rounded-control border border-line bg-surface-muted px-3 py-2 font-mono text-ink-secondary">{source}</div>)}
          </div>
          <div className="mt-4 flex items-center gap-2"><Badge tone="info">Roles: {roles.join(', ') || 'HR_OFFICER'}</Badge><Badge tone="caution">PII masked</Badge></div>
        </Card>
      </div>
      <Card className="mt-5">
        <CardHeader title="JSON result" description="Payload resolve dùng để đối chiếu với API response." actions={<Button variant="secondary" size="sm" icon={copied ? Check : Copy} onClick={() => { void navigator.clipboard?.writeText(json); setCopied(true) }}>{copied ? 'Đã copy' : 'Copy JSON'}</Button>} />
        <pre className="overflow-x-auto rounded-control bg-ink p-4 text-xs leading-5 text-[#D6DBE3]">{json}</pre>
      </Card>
    </>
  )
}

function Result({ label, allowed, scope }: { label: string; allowed: boolean; scope?: string }) {
  return <div className="flex items-center justify-between rounded-control border border-line px-3 py-3"><span className="text-sm text-ink-secondary">{label}</span><span className="flex items-center gap-2"><Badge tone={allowed ? 'positive' : 'neutral'}>{allowed ? 'Có' : 'Không'}</Badge>{scope && <span className="text-xs text-ink-subtle">{scope}</span>}</span></div>
}
