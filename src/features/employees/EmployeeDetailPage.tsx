import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowLeft, Pencil, X } from 'lucide-react'
import { employeeApi } from '@/shared/api/endpoints'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { ActionGate } from '@/shared/permissions/ScreenGuard'
import { Avatar, Badge, Button, Card, PageHeader, SkeletonCard } from '@/shared/ui/primitives'
import { EmptyState, ErrorState, Toast } from '@/shared/ui/feedback'
import { EMPLOYEE_COLUMN_ORDER, humanizeValue } from '@/shared/ui/FieldTable'
import { FieldSections } from './FieldSections'
import { EmployeeFieldForm } from './EmployeeFieldForm'

/**
 * One layout serves "someone's profile", "edit that profile" and "my profile". What changes between
 * them is not the page — it is which record is reachable and which fields come back, and the server
 * decides both.
 */
export function EmployeeDetailPage({
  employeeId,
  title,
  description,
  backTo,
  alwaysEditing = false,
}: {
  employeeId: number | null
  title: string
  description?: string
  backTo?: { to: string; label: string }
  alwaysEditing?: boolean
}) {
  const { screen } = useActiveScreen()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(alwaysEditing)
  const [saved, setSaved] = useState(false)

  const detail = useQuery({
    queryKey: ['employee', screen.screenCode, employeeId],
    queryFn: () => employeeApi.detail(screen, employeeId!),
    enabled: employeeId != null,
  })

  const update = useMutation({
    mutationFn: (values: Record<string, unknown>) => employeeApi.update(screen, employeeId!, values),
    onSuccess: (row) => {
      queryClient.setQueryData(['employee', screen.screenCode, employeeId], row)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      setSaved(true)
      if (!alwaysEditing) setEditing(false)
    },
  })

  if (employeeId == null) {
    return (
      <Card>
        <EmptyState
          title="Tài khoản của bạn chưa gắn với hồ sơ nhân viên"
          description="Nhờ bộ phận nhân sự liên kết tài khoản với hồ sơ để xem thông tin cá nhân."
        />
      </Card>
    )
  }

  const fields = detail.data?.fields ?? {}
  const name = typeof fields.fullName === 'string' ? fields.fullName : `Nhân viên #${employeeId}`
  const status = typeof fields.status === 'string' ? fields.status : undefined

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumb={
          backTo && (
            <Link to={backTo.to} className="inline-flex items-center gap-1.5 hover:text-ink">
              <ArrowLeft size={14} strokeWidth={2} aria-hidden />
              {backTo.label}
            </Link>
          )
        }
        actions={
          !alwaysEditing && (
            <ActionGate action="UPDATE">
              <Button
                variant={editing ? 'secondary' : 'primary'}
                icon={editing ? X : Pencil}
                onClick={() => setEditing((value) => !value)}
                data-testid="toggle-edit"
              >
                {editing ? 'Huỷ chỉnh sửa' : 'Chỉnh sửa'}
              </Button>
            </ActionGate>
          )
        }
      />

      {detail.isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {detail.error != null && (
        <Card padded={false}>
          <ErrorState error={detail.error} onRetry={() => detail.refetch()} />
        </Card>
      )}

      {detail.data && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={name} size="lg" />
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold">{name}</h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                  {typeof fields.jobTitle === 'string' && <span>{fields.jobTitle}</span>}
                  {typeof fields.team === 'string' && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{fields.team}</span>
                    </>
                  )}
                  {typeof fields.employeeCode === 'string' && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="font-mono text-xs">{fields.employeeCode}</span>
                    </>
                  )}
                </p>
              </div>
              {status && (
                <span className="ml-auto">
                  <Badge tone={status === 'ACTIVE' ? 'positive' : 'caution'}>{humanizeValue('status', status)}</Badge>
                </span>
              )}
            </div>
          </Card>

          {editing ? (
            <Card>
              <EmployeeFieldForm
                mode="update"
                initial={fields}
                submitLabel="Lưu thay đổi"
                pending={update.isPending}
                error={update.error}
                onSubmit={(values) => {
                  setSaved(false)
                  update.mutate(values)
                }}
                onCancel={alwaysEditing ? undefined : () => setEditing(false)}
              />
            </Card>
          ) : (
            <FieldSections fields={fields} order={EMPLOYEE_COLUMN_ORDER} />
          )}
        </div>
      )}

      <Toast open={saved} message="Đã lưu thay đổi" onClose={() => setSaved(false)} />
    </>
  )
}
