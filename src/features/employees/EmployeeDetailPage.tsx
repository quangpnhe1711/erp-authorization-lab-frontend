import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { employeeApi } from '@/shared/api/endpoints'
import { useActiveScreen } from '@/shared/permissions/activeScreen'
import { ActionGate } from '@/shared/permissions/ScreenGuard'
import { Button, Card, CardHeader, PageHeader, Spinner } from '@/shared/ui/primitives'
import { Alert, ApiErrorPanel } from '@/shared/ui/feedback'
import { EMPLOYEE_COLUMN_ORDER } from '@/shared/ui/FieldTable'
import { FieldSections } from './FieldSections'
import { EmployeeFieldForm } from './EmployeeFieldForm'
import { ScopeSummary } from './ScopeSummary'

/**
 * One page serves EMPLOYEE_DETAIL, EMPLOYEE_EDIT and MY_PROFILE: the screen context decides which
 * record is reachable and which fields are readable/updatable, so the layout stays identical.
 */
export function EmployeeDetailPage({
  employeeId,
  title,
  eyebrow,
  description,
  alwaysEditing = false,
}: {
  employeeId: number | null
  title: string
  eyebrow: string
  description?: string
  alwaysEditing?: boolean
}) {
  const { screen, permission } = useActiveScreen()
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
      setSaved(true)
      if (!alwaysEditing) setEditing(false)
    },
  })

  if (employeeId == null) {
    return <Alert tone="warning" title="Không xác định được nhân viên">Tài khoản này chưa gắn với hồ sơ nhân viên.</Alert>
  }

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            <Link to="/hrm/employees">
              <Button variant="ghost" size="sm">
                ← Danh sách
              </Button>
            </Link>
            {!alwaysEditing && (
              <ActionGate action="UPDATE">
                <Button size="sm" onClick={() => setEditing((v) => !v)} data-testid="toggle-edit">
                  {editing ? 'Xem' : 'Chỉnh sửa'}
                </Button>
              </ActionGate>
            )}
          </>
        }
      />

      <ScopeSummary permission={permission} />

      {detail.isLoading && <Spinner />}
      {detail.error != null && <ApiErrorPanel error={detail.error} className="mt-6" />}

      {detail.data && (
        <Card className="mt-6">
          <CardHeader
            eyebrow={editing ? 'Chỉnh sửa' : 'Hồ sơ'}
            title={String(detail.data.fields.fullName ?? `Nhân viên #${detail.data.id}`)}
            description={
              editing
                ? 'Chỉ những trường thuộc field group được phép ghi mới hiển thị. Backend vẫn kiểm tra lại.'
                : 'Trường không đọc được sẽ không xuất hiện — không phải hiển thị rỗng.'
            }
          />

          {/* Also shown while still editing: the edit-only screen never leaves edit mode. */}
          {saved && (
            <Alert tone="success" title="Đã lưu" className="mb-5">
              Cập nhật thành công.
            </Alert>
          )}

          {editing ? (
            <EmployeeFieldForm
              mode="update"
              initial={detail.data.fields}
              submitLabel="Lưu thay đổi"
              pending={update.isPending}
              error={update.error}
              onSubmit={(values) => {
                setSaved(false)
                update.mutate(values)
              }}
              onCancel={alwaysEditing ? undefined : () => setEditing(false)}
            />
          ) : (
            <FieldSections fields={detail.data.fields} order={EMPLOYEE_COLUMN_ORDER} />
          )}
        </Card>
      )}
    </>
  )
}
