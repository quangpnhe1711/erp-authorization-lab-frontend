import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, Play, X } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  KeyValue,
  Label,
  PageHeader,
  Select,
  Table,
  Tabs,
  Td,
  Th,
} from '@/shared/ui/primitives'
import { ErrorNotice } from '@/shared/ui/feedback'
import { labApi } from './api'
import { useLabScreens, useLabUsers } from './hooks'
import { PayloadInspector } from './PayloadInspector'
import { ACTION_LABELS, SCOPE_LABELS } from './labVocabulary'
import type { ActionDecision, ActionName, ResolveRequest, ScopeCode } from './types'

/**
 * The verification screen: pick a user, a screen and a target record, and read back not just the
 * answer but where every part of it came from. If the resolver and this screen ever disagree with the
 * configuration screen, this is the one that is right — it calls the real resolver.
 */
export function ExplorerPage() {
  const users = useLabUsers()
  const screens = useLabScreens()

  const [userId, setUserId] = useState<number | null>(null)
  const [screenKey, setScreenKey] = useState<string>('EMPLOYEE_DETAIL')
  const [targetId, setTargetId] = useState<string>('')
  const [fieldName, setFieldName] = useState<string>('phoneNumber')
  const [tab, setTab] = useState('answer')

  const employees = useMemo(
    () => (users.data ?? []).filter((u) => u.employeeId != null),
    [users.data],
  )

  useEffect(() => {
    if (userId == null && employees.length) {
      setUserId(employees.find((u) => u.username.startsWith('nguyen-van-a'))?.id ?? employees[0]!.id)
    }
  }, [employees, userId])

  const screen = (screens.data ?? []).find((s) => s.screenCode === screenKey)

  const request: ResolveRequest = useMemo(
    () => ({
      userId: userId ?? 0,
      screenKey,
      targetRecord: targetId
        ? { resource: screen?.resourceCode ?? 'EMPLOYEE', id: targetId }
        : null,
    }),
    [userId, screenKey, targetId, screen?.resourceCode],
  )

  const resolve = useMutation({ mutationFn: () => labApi.resolve(request) })
  const result = resolve.data

  const fields = useMemo(() => Object.keys(result?.fields ?? {}).sort(), [result])
  useEffect(() => {
    if (fields.length && !fields.includes(fieldName)) setFieldName(fields[0]!)
  }, [fields, fieldName])

  const decision = result?.fields[fieldName]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tra cứu quyền hiệu lực"
        description="Vì sao một user có — hoặc không có — một quyền cụ thể trên một bản ghi cụ thể."
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Label htmlFor="explorer-user">User</Label>
            <Select
              id="explorer-user"
              value={userId ?? ''}
              onChange={(event) => setUserId(Number(event.target.value))}
              data-testid="explorer-user"
            >
              {(users.data ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.employeeName ?? user.username}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="explorer-screen">Màn hình</Label>
            <Select
              id="explorer-screen"
              value={screenKey}
              onChange={(event) => setScreenKey(event.target.value)}
              data-testid="explorer-screen"
            >
              {(screens.data ?? []).map((s) => (
                <option key={s.screenCode} value={s.screenCode}>
                  {s.moduleKey} · {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="explorer-target" hint="Id hoặc mã bản ghi">
              Bản ghi đích
            </Label>
            <Select
              id="explorer-target"
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              data-testid="explorer-target"
            >
              <option value="">Không chỉ định</option>
              {/* The employee id is sent as the record id; the backend accepts either it or the code. */}
              {employees.map((user) => (
                <option key={user.id} value={String(user.employeeId)}>
                  {user.employeeName}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              icon={Play}
              onClick={() => resolve.mutate()}
              disabled={!userId || resolve.isPending}
              data-testid="explorer-run"
              className="w-full"
            >
              {resolve.isPending ? 'Đang tính…' : 'Tra cứu'}
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-subtle">
          Với resource chưa có bảng dữ liệu thật, backend nhận mô tả bản ghi ngay trong payload
          (phòng ban, nhóm, người phụ trách) nên vẫn resolve được.
        </p>
      </Card>

      {resolve.error != null && <ErrorNotice error={resolve.error} />}

      {result && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-5">
            <Card>
              <CardHeader title="Kết quả cuối cùng" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <KeyValue label="Vào được màn">
                  <YesNo value={result.canEnter} />
                </KeyValue>
                <KeyValue label="Field đang xem">
                  <Select
                    value={fieldName}
                    onChange={(event) => setFieldName(event.target.value)}
                    aria-label="Chọn field"
                    data-testid="explorer-field"
                  >
                    {fields.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </KeyValue>
                <KeyValue label="Giá trị trả về">
                  <span data-testid="explorer-value" className="font-mono text-sm">
                    {decision == null
                      ? '—'
                      : decision.returnedValuePolicy === 'HIDDEN'
                        ? 'không có trong response'
                        : String(decision.value ?? 'null')}
                  </span>
                </KeyValue>
                <KeyValue label={ACTION_LABELS.read}>
                  <YesNo value={decision?.read.allowed ?? false} scope={decision?.read.matchedScope} />
                </KeyValue>
                <KeyValue label={ACTION_LABELS.update}>
                  <YesNo value={decision?.update.allowed ?? false} scope={decision?.update.matchedScope} />
                </KeyValue>
                <KeyValue label={ACTION_LABELS.unmask}>
                  <YesNo value={decision?.unmask.allowed ?? false} scope={decision?.unmask.matchedScope} />
                </KeyValue>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['read', 'update', 'unmask'] as ActionName[]).map((action) => (
                  <Badge key={action} tone="neutral">
                    {ACTION_LABELS[action]} toàn màn:{' '}
                    {result.effectiveRecordScopes[action].map((s) => SCOPE_LABELS[s]).join(', ') || 'Không có'}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card padded={false}>
              <div className="px-5 pt-5">
                <Tabs
                  tabs={[
                    { id: 'answer', label: 'Nguồn quyền' },
                    { id: 'trace', label: 'Luồng resolve' },
                    { id: 'fields', label: 'Tất cả field' },
                    { id: 'actions', label: 'Hành động' },
                  ]}
                  active={tab}
                  onChange={setTab}
                />
              </div>

              {tab === 'answer' && (
                <div className="space-y-4 p-5" data-testid="explorer-sources">
                  <Sources label="Vào màn" sources={result.screenAccessSources} />
                  {decision && (
                    <>
                      <Sources label={ACTION_LABELS.read} sources={decision.read.sources} />
                      <Sources label={ACTION_LABELS.update} sources={decision.update.sources} />
                      <Sources label={ACTION_LABELS.unmask} sources={decision.unmask.sources} />
                    </>
                  )}
                </div>
              )}

              {tab === 'trace' && (
                <ol className="space-y-1.5 p-5 text-sm text-ink-secondary" data-testid="explorer-trace">
                  {result.trace.map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ol>
              )}

              {tab === 'fields' && (
                <Table data-testid="explorer-fields">
                  <thead>
                    <tr>
                      <Th className="w-56">Field</Th>
                      <Th className="w-40">Nhóm</Th>
                      <Th className="w-24">Xem</Th>
                      <Th className="w-24">Sửa</Th>
                      <Th className="w-28">Xem thật</Th>
                      <Th className="w-32">Chính sách</Th>
                      <Th>Giá trị</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(result.fields).map((field) => (
                      <tr key={field.fieldName} data-testid={`explorer-row-${field.fieldName}`}>
                        <Td>
                          <span className="block font-medium text-ink">{field.displayName}</span>
                          <span className="block text-xs text-ink-subtle">{field.fieldName}</span>
                        </Td>
                        <Td>
                          <span className="text-xs text-ink-muted">{field.groups.join(', ')}</span>
                        </Td>
                        <Td>
                          <YesNo value={field.read.allowed} scope={field.read.matchedScope} />
                        </Td>
                        <Td>
                          <YesNo value={field.update.allowed} scope={field.update.matchedScope} />
                        </Td>
                        <Td>
                          <YesNo value={field.unmask.allowed} scope={field.unmask.matchedScope} />
                        </Td>
                        <Td>
                          <Badge
                            tone={
                              field.returnedValuePolicy === 'VISIBLE'
                                ? 'positive'
                                : field.returnedValuePolicy === 'MASKED'
                                  ? 'caution'
                                  : 'neutral'
                            }
                          >
                            {field.returnedValuePolicy}
                          </Badge>
                        </Td>
                        <Td>
                          <span className="font-mono text-xs">{String(field.value ?? '—')}</span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {tab === 'actions' && (
                <Table>
                  <thead>
                    <tr>
                      <Th className="w-44">Hành động</Th>
                      <Th className="w-28">Được phép</Th>
                      <Th className="w-44">Khớp phạm vi</Th>
                      <Th>Nguồn</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.resourceActions).map(([code, action]) => (
                      <tr key={code}>
                        <Td>{code}</Td>
                        <Td>
                          <YesNo value={action.allowed} />
                        </Td>
                        <Td>{action.matchedScope ? SCOPE_LABELS[action.matchedScope] : '—'}</Td>
                        <Td>
                          <span className="text-xs text-ink-muted">
                            {action.sources.map((s) => `${s.roleCode}/${s.scope}`).join(', ') || '—'}
                          </span>
                        </Td>
                      </tr>
                    ))}
                    {Object.keys(result.resourceActions).length === 0 && (
                      <tr>
                        <Td className="text-sm text-ink-muted">Màn này chưa cấu hình hành động nào.</Td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              )}
            </Card>
          </div>

          <PayloadInspector request={request} response={result} title="JSON result" />
        </div>
      )}

      {!result && !resolve.isPending && (
        <PayloadInspector request={request} title="Payload sẽ gửi" />
      )}
    </div>
  )
}

function YesNo({ value, scope }: { value: boolean; scope?: ScopeCode | null }) {
  return (
    <span className="flex items-center gap-1.5 text-sm">
      {value ? (
        <Check size={15} className="text-positive-500" aria-hidden />
      ) : (
        <X size={15} className="text-ink-subtle" aria-hidden />
      )}
      {value ? 'Có' : 'Không'}
      {scope && <span className="text-xs text-ink-subtle">({SCOPE_LABELS[scope]})</span>}
    </span>
  )
}

function Sources({ label, sources }: { label: string; sources: ActionDecision['sources'] }) {
  return (
    <div>
      <p className="section-label">{label}</p>
      {sources.length === 0 ? (
        <p className="mt-1 text-sm text-ink-subtle">Không có nguồn nào cấp quyền này.</p>
      ) : (
        <ul className="mt-1 space-y-1 text-sm">
          {sources.map((source, index) => (
            <li key={index} className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{source.scope ? SCOPE_LABELS[source.scope] : '—'}</Badge>
              <span className="text-ink-secondary">← {source.roleCode}</span>
              {source.groupCode && <span className="text-ink-muted">← {source.groupCode}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
