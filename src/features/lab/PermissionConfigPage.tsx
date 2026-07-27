import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, Save, Search } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Label,
  PageHeader,
  SearchInput,
  Select,
  SkeletonRows,
} from '@/shared/ui/primitives'
import { Alert, ErrorNotice, Toast } from '@/shared/ui/feedback'
import { labApi } from './api'
import { useLabRoles, useLabScreens, useRoleScreenConfig, useVocabulary } from './hooks'
import { PermissionMatrix } from './PermissionMatrix'
import { ImpactDrawer } from './ImpactDrawer'
import { PayloadInspector, type PayloadEntry } from './PayloadInspector'
import { EffectivePreview } from './EffectivePreview'
import { ACTION_LABELS, RESOURCE_ACTION_LABELS, SCOPE_LABELS, buildLattice } from './labVocabulary'
import type {
  ActionName,
  ActionPermission,
  GroupPermissionView,
  ImpactAnalysis,
  ResourceActionView,
  ScopeCode,
  ScreenConfigUpdate,
} from './types'

/**
 * The configuration screen. Its whole job is to make the model visible: the source configuration on
 * the left, the resolved consequence underneath, and the exact payload it will send on the right.
 */
export function PermissionConfigPage() {
  const queryClient = useQueryClient()
  const roles = useLabRoles()
  const screens = useLabScreens()
  const vocabulary = useVocabulary()

  const [roleCode, setRoleCode] = useState<string | null>(null)
  const [moduleKey, setModuleKey] = useState<string | null>(null)
  const [screenKey, setScreenKey] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [piiOnly, setPiiOnly] = useState(false)
  const [configuredOnly, setConfiguredOnly] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [history, setHistory] = useState<PayloadEntry[]>([])
  const [impact, setImpact] = useState<ImpactAnalysis | null>(null)
  const [impactOpen, setImpactOpen] = useState(false)

  // Draft state
  const [canEnter, setCanEnter] = useState(false)
  const [maxRecordScope, setMaxRecordScope] = useState<ScopeCode | null>(null)
  const [groups, setGroups] = useState<GroupPermissionView[]>([])
  const [actions, setActions] = useState<ResourceActionView[]>([])
  const [dirty, setDirty] = useState(false)

  const scopeCodes = useMemo(
    () => (vocabulary.data?.scopes ?? []).map((s) => s.code),
    [vocabulary.data],
  )
  const lattice = useMemo(() => buildLattice(vocabulary.data?.containments ?? []), [vocabulary.data])

  const roleModules = useMemo(
    () => roles.data?.find((r) => r.code === roleCode)?.modules ?? [],
    [roles.data, roleCode],
  )
  const modules = useMemo(
    () => [...new Set((screens.data ?? []).map((s) => s.moduleKey))],
    [screens.data],
  )
  const screensOfModule = useMemo(
    () => (screens.data ?? []).filter((s) => s.moduleKey === moduleKey),
    [screens.data, moduleKey],
  )

  useEffect(() => {
    if (!roleCode && roles.data?.length) setRoleCode(roles.data[0]!.code)
  }, [roles.data, roleCode])
  useEffect(() => {
    if (!moduleKey && modules.length) setModuleKey(roleModules[0] ?? modules[0]!)
  }, [modules, moduleKey, roleModules])
  useEffect(() => {
    if (screensOfModule.length && !screensOfModule.some((s) => s.screenCode === screenKey)) {
      setScreenKey(screensOfModule[0]!.screenCode)
    }
  }, [screensOfModule, screenKey])

  const config = useRoleScreenConfig(roleCode, screenKey)

  useEffect(() => {
    const screen = config.data?.screen
    if (!screen) return
    setCanEnter(screen.canEnter)
    setMaxRecordScope(screen.maxRecordScope)
    setGroups(screen.groups)
    setActions(screen.resourceActions)
    setDirty(false)
  }, [config.data])

  const payload: ScreenConfigUpdate = useMemo(
    () => ({
      roleCode: roleCode ?? '',
      screenKey: screenKey ?? '',
      canEnter,
      maxRecordScope,
      groups: groups
        .filter((g) => g.read.enabled || g.update.enabled || g.unmask.enabled)
        .map((g) => ({
          groupKey: g.groupCode,
          read: g.read,
          update: g.update,
          unmask: g.unmask,
        })),
      resourceActions: actions.map((a) => ({
        actionCode: a.actionCode,
        enabled: a.enabled,
        scope: a.enabled ? a.scope : null,
      })),
    }),
    [roleCode, screenKey, canEnter, maxRecordScope, groups, actions],
  )

  const save = useMutation({
    mutationFn: () => labApi.saveScreenConfig(payload),
    onSuccess: (result) => {
      setDirty(false)
      setImpactOpen(false)
      setToast('Đã lưu cấu hình quyền')
      setHistory((entries) => [
        { at: new Date().toLocaleTimeString(), label: 'Lưu cấu hình', request: payload, response: result },
        ...entries,
      ])
      queryClient.invalidateQueries({ queryKey: ['lab'] })
    },
    onError: (error) => {
      setImpactOpen(false)
      setHistory((entries) => [
        { at: new Date().toLocaleTimeString(), label: 'Lưu thất bại', request: payload, error },
        ...entries,
      ])
    },
  })

  const preview = useMutation({
    mutationFn: () => labApi.impact(payload),
    onSuccess: (result) => {
      setImpact(result)
      setImpactOpen(true)
    },
  })

  const patchGroup = (groupCode: string, action: ActionName, next: ActionPermission) => {
    setGroups((rows) =>
      rows.map((row) => {
        if (row.groupCode !== groupCode) return row
        const updated = { ...row, [action]: next }
        // Turning read off takes update and unmask with it: neither can exist without read.
        if (action === 'read' && !next.enabled) {
          updated.update = { enabled: false, scope: null }
          updated.unmask = { enabled: false, scope: null }
        }
        return updated
      }),
    )
    setDirty(true)
  }

  const patchAction = (actionCode: string, next: Partial<ResourceActionView>) => {
    setActions((rows) =>
      rows.map((row) => (row.actionCode === actionCode ? { ...row, ...next } : row)),
    )
    setDirty(true)
  }

  const visibleGroups = useMemo(() => {
    const term = search.trim().toLowerCase()
    return groups.filter((group) => {
      if (piiOnly && !group.containsPii) return false
      if (configuredOnly && !(group.read.enabled || group.update.enabled || group.unmask.enabled)) return false
      if (!term) return true
      return (
        group.groupCode.toLowerCase().includes(term) ||
        group.groupName.toLowerCase().includes(term) ||
        group.multiGroupFields.some((f) => f.toLowerCase().includes(term))
      )
    })
  }, [groups, search, piiOnly, configuredOnly])

  const blockingIssues = config.data?.issues.filter((i) => i.severity === 'ERROR') ?? []
  const moduleMismatch = Boolean(moduleKey && roleCode && !roleModules.includes(moduleKey))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cấu hình quyền"
        description="Một vai trò, một màn hình: được vào đâu, nhìn thấy bản ghi nào, và làm gì được với từng nhóm thông tin."
      />

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="role">Vai trò</Label>
            <Select
              id="role"
              value={roleCode ?? ''}
              onChange={(event) => setRoleCode(event.target.value)}
              data-testid="select-role"
            >
              {(roles.data ?? []).map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name} · {role.code}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="module" hint={roleModules.length ? `Áp dụng: ${roleModules.join(', ')}` : undefined}>
              Module
            </Label>
            <Select
              id="module"
              value={moduleKey ?? ''}
              onChange={(event) => setModuleKey(event.target.value)}
              data-testid="select-module"
            >
              {modules.map((key) => (
                <option key={key} value={key}>
                  {key}
                  {roleModules.includes(key) ? '' : ' (vai trò chưa áp dụng)'}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="screen">Màn hình</Label>
            <Select
              id="screen"
              value={screenKey ?? ''}
              onChange={(event) => setScreenKey(event.target.value)}
              data-testid="select-screen"
            >
              {screensOfModule.map((screen) => (
                <option key={screen.screenCode} value={screen.screenCode}>
                  {screen.name} · {screen.screenCode}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {moduleMismatch && (
        <Alert tone="caution" title="Vai trò chưa được áp dụng cho module này">
          Cấu hình sẽ bị chặn khi lưu. Thêm module {moduleKey} vào vai trò {roleCode} trước.
        </Alert>
      )}

      {blockingIssues.length > 0 && (
        <Alert tone="error" title={`${blockingIssues.length} cấu hình đang vi phạm quy tắc`}>
          <ul className="mt-1 space-y-1">
            {blockingIssues.map((issue, index) => (
              <li key={index}>
                {issue.groupCode ? `${issue.groupCode}: ` : ''}
                {issue.message}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {config.error != null && <ErrorNotice error={config.error} />}
      {save.error != null && <ErrorNotice error={save.error} />}
      {preview.error != null && <ErrorNotice error={preview.error} />}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader
              title="Truy cập màn hình"
              description="Phạm vi tối đa là trần cho mọi phạm vi cấu hình bên trong màn."
            />
            <div className="flex flex-wrap items-end gap-6">
              <Checkbox
                checked={canEnter}
                onChange={(event) => {
                  setCanEnter(event.target.checked)
                  setDirty(true)
                }}
                label="Được truy cập màn"
                data-testid="can-enter"
              />
              <div className="w-56">
                <Label htmlFor="max-scope">Phạm vi record tối đa</Label>
                <Select
                  id="max-scope"
                  value={maxRecordScope ?? ''}
                  onChange={(event) => {
                    setMaxRecordScope((event.target.value || null) as ScopeCode | null)
                    setDirty(true)
                  }}
                  data-testid="max-record-scope"
                >
                  <option value="">—</option>
                  {scopeCodes.map((scope) => (
                    <option key={scope} value={scope}>
                      {SCOPE_LABELS[scope]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader
              className="m-0 px-5 pt-5"
              title="Hành động trên bản ghi"
              description="Tạo, xoá, xuất và các hành động nghiệp vụ — mỗi hành động có phạm vi riêng."
            />
            <div className="grid gap-x-8 gap-y-3 px-5 pb-5 sm:grid-cols-2">
              {actions.map((action) => (
                <div key={action.actionCode} className="flex items-center justify-between gap-3">
                  <Checkbox
                    checked={action.enabled}
                    label={RESOURCE_ACTION_LABELS[action.actionCode] ?? action.actionCode}
                    data-testid={`action-${action.actionCode}`}
                    onChange={(event) =>
                      patchAction(action.actionCode, {
                        enabled: event.target.checked,
                        scope: event.target.checked ? (maxRecordScope ?? 'SELF') : null,
                      })
                    }
                  />
                  <Select
                    value={action.scope ?? ''}
                    disabled={!action.enabled}
                    aria-label={`Phạm vi ${action.actionCode}`}
                    data-testid={`action-scope-${action.actionCode}`}
                    className="w-40"
                    onChange={(event) =>
                      patchAction(action.actionCode, { scope: (event.target.value || null) as ScopeCode | null })
                    }
                  >
                    <option value="">—</option>
                    {scopeCodes
                      .filter((scope) => !maxRecordScope || lattice.isProvablyWithin(scope, maxRecordScope))
                      .map((scope) => (
                        <option key={scope} value={scope}>
                          {SCOPE_LABELS[scope]}
                        </option>
                      ))}
                  </Select>
                </div>
              ))}
            </div>
          </Card>

          <Card padded={false}>
            <CardHeader
              className="m-0 flex-wrap px-5 pt-5"
              title="Quyền theo nhóm thông tin"
              description="Xem, sửa và xem giá trị thật được cấu hình độc lập; mỗi cột có phạm vi của riêng nó."
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  <SearchInput
                    icon={Search}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm nhóm hoặc field"
                    aria-label="Tìm nhóm field"
                    data-testid="group-search"
                    className="h-9 w-52"
                  />
                  <Checkbox
                    checked={piiOnly}
                    onChange={(event) => setPiiOnly(event.target.checked)}
                    label="Chỉ nhóm nhạy cảm"
                    data-testid="filter-pii"
                  />
                  <Checkbox
                    checked={configuredOnly}
                    onChange={(event) => setConfiguredOnly(event.target.checked)}
                    label="Chỉ nhóm đã cấu hình"
                    data-testid="filter-configured"
                  />
                </div>
              }
            />
            <div className="max-h-[520px] overflow-auto">
              {config.isLoading ? (
                <SkeletonRows rows={6} columns={7} />
              ) : (
                <PermissionMatrix
                  rows={visibleGroups}
                  scopes={scopeCodes}
                  lattice={lattice}
                  maxRecordScope={maxRecordScope}
                  onChange={patchGroup}
                />
              )}
            </div>
          </Card>

          <EffectivePreview groups={groups} lattice={lattice} />
        </div>

        <div className="space-y-4">
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm">
              {dirty ? (
                <>
                  <CircleAlert size={15} className="text-caution-500" aria-hidden />
                  <span className="text-ink-secondary" data-testid="unsaved-indicator">
                    Có thay đổi chưa lưu
                  </span>
                </>
              ) : (
                <Badge tone="positive">Đã đồng bộ</Badge>
              )}
            </span>
            <Button
              icon={Save}
              disabled={!dirty || preview.isPending || save.isPending}
              onClick={() => preview.mutate()}
              data-testid="save-config"
            >
              {preview.isPending ? 'Đang phân tích…' : 'Lưu thay đổi'}
            </Button>
          </Card>

          <PayloadInspector
            request={payload}
            response={save.data}
            error={save.error}
            history={history}
            title="Payload Preview"
          />
        </div>
      </div>

      <ImpactDrawer
        open={impactOpen}
        impact={impact}
        pending={save.isPending}
        onCancel={() => setImpactOpen(false)}
        onConfirm={() => save.mutate()}
      />
      <Toast open={toast != null} message={toast ?? ''} onClose={() => setToast(null)} />
    </div>
  )
}

export { ACTION_LABELS }
