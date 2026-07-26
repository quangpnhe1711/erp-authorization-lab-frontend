import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { employeeApi } from '@/shared/api/endpoints'
import { useAuth } from '@/shared/auth/AuthProvider'
import { Card, CardHeader, PageHeader } from '@/shared/ui/primitives'
import { Alert } from '@/shared/ui/feedback'
import { EmployeeDetailPage } from './EmployeeDetailPage'
import { EmployeeFieldForm } from './EmployeeFieldForm'

export function EmployeeDetailRoute() {
  const { id } = useParams()
  return (
    <EmployeeDetailPage
      employeeId={id ? Number(id) : null}
      eyebrow="HRM · Employee"
      title="Chi tiết nhân viên"
      description="Bản ghi phải nằm trong record scope của màn hình EMPLOYEE_DETAIL, nếu không backend trả RECORD_PERMISSION_DENIED."
    />
  )
}

export function EmployeeEditRoute() {
  const { id } = useParams()
  return (
    <EmployeeDetailPage
      employeeId={id ? Number(id) : null}
      eyebrow="HRM · Employee"
      title="Chỉnh sửa nhân viên"
      description="Màn hình EMPLOYEE_EDIT có field group ghi riêng, khác với EMPLOYEE_DETAIL."
      alwaysEditing
    />
  )
}

export function MyProfileRoute() {
  const { me } = useAuth()
  return (
    <EmployeeDetailPage
      employeeId={me?.employeeId ?? null}
      eyebrow="HRM · Employee"
      title="Hồ sơ của tôi"
      description="Record scope SELF: chỉ thấy chính mình. Thử sửa lương để nhận FIELD_PERMISSION_DENIED."
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
        eyebrow="HRM · Employee"
        title="Tạo nhân viên"
        description="EMPLOYEE_CREATE chỉ cấp quyền CREATE trên field group — không có quyền đọc, nên response sau khi tạo không trả về trường nào."
      />

      <Card>
        <CardHeader eyebrow="Form" title="Thông tin nhân viên mới" />
        {createdId != null && (
          <Alert tone="success" title="Đã tạo" className="mb-5">
            Nhân viên #{createdId} đã được tạo.{' '}
            <button
              type="button"
              className="underline"
              onClick={() => navigate(`/hrm/employees/${createdId}`)}
            >
              Mở chi tiết
            </button>
          </Alert>
        )}
        <EmployeeFieldForm
          mode="create"
          initial={{}}
          submitLabel="Tạo nhân viên"
          pending={create.isPending}
          error={create.error}
          onSubmit={(values) => {
            setCreatedId(null)
            create.mutate(values)
          }}
          onCancel={() => navigate('/hrm/employees')}
        />
      </Card>
    </>
  )
}
