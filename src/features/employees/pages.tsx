import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { employeeApi } from '@/shared/api/endpoints'
import { useAuth } from '@/shared/auth/AuthProvider'
import { Button, Card, PageHeader } from '@/shared/ui/primitives'
import { Alert, Toast } from '@/shared/ui/feedback'
import { EmployeeDetailPage } from './EmployeeDetailPage'
import { EmployeeFieldForm } from './EmployeeFieldForm'

export function EmployeeDetailRoute() {
  const { id } = useParams()
  return (
    <EmployeeDetailPage
      employeeId={id ? Number(id) : null}
      title="Hồ sơ nhân viên"
      backTo={{ to: '/hrm/employees', label: 'Nhân viên' }}
    />
  )
}

export function EmployeeEditRoute() {
  const { id } = useParams()
  return (
    <EmployeeDetailPage
      employeeId={id ? Number(id) : null}
      title="Chỉnh sửa hồ sơ"
      description="Chỉ những thông tin bạn được phép sửa mới hiện ở đây."
      backTo={{ to: '/hrm/employees', label: 'Nhân viên' }}
      alwaysEditing
    />
  )
}

export function MyProfileRoute() {
  const { me } = useAuth()
  return (
    <EmployeeDetailPage
      employeeId={me?.employeeId ?? null}
      title="Hồ sơ của tôi"
      description="Thông tin cá nhân của bạn trong hệ thống."
    />
  )
}

export function EmployeeCreateRoute() {
  const navigate = useNavigate()
  const [createdId, setCreatedId] = useState<number | null>(null)

  const create = useMutation({
    mutationFn: (values: Record<string, unknown>) => employeeApi.create(values),
    onSuccess: (row) => setCreatedId(row.id),
  })

  return (
    <>
      <PageHeader
        title="Thêm nhân viên"
        description="Nhập thông tin cơ bản, bạn có thể bổ sung chi tiết sau khi hồ sơ được tạo."
        breadcrumb={
          <button type="button" onClick={() => navigate('/hrm/employees')} className="hover:text-ink">
            ← Nhân viên
          </button>
        }
      />

      <Card className="max-w-3xl">
        {createdId != null && (
          <Alert tone="success" title="Đã tạo hồ sơ" className="mb-5">
            <p>Hồ sơ mới đã được lưu.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => navigate(`/hrm/employees/${createdId}`)}
            >
              Mở hồ sơ
            </Button>
          </Alert>
        )}
        <EmployeeFieldForm
          mode="create"
          initial={{}}
          submitLabel="Tạo hồ sơ"
          pending={create.isPending}
          error={create.error}
          onSubmit={(values) => {
            setCreatedId(null)
            create.mutate(values)
          }}
          onCancel={() => navigate('/hrm/employees')}
        />
      </Card>

      <Toast open={createdId != null} message="Đã tạo hồ sơ nhân viên" onClose={() => setCreatedId(null)} />
    </>
  )
}
