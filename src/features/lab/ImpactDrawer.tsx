import { ArrowRight, TriangleAlert, Users } from 'lucide-react'
import { Badge, Button, KeyValue } from '@/shared/ui/primitives'
import { Modal } from '@/shared/ui/feedback'
import { ACTION_LABELS, SCOPE_LABELS } from './labVocabulary'
import type { ActionName, ImpactAnalysis, ScopeCode } from './types'

function scopeList(scopes: ScopeCode[]): string {
  return scopes.length === 0 ? 'Không có' : scopes.map((s) => SCOPE_LABELS[s] ?? s).join(', ')
}

/**
 * Shown before a save that widens anything. It reports each action separately on purpose: the whole
 * point of the model is that a wider read scope does not imply a wider update or unmask scope, and a
 * reviewer must be able to see that in the diff rather than take it on trust.
 */
export function ImpactDrawer({
  open,
  impact,
  onCancel,
  onConfirm,
  pending,
}: {
  open: boolean
  impact: ImpactAnalysis | null
  onCancel: () => void
  onConfirm: () => void
  pending?: boolean
}) {
  if (!impact) return null
  const widening = impact.changes.filter((c) => c.widening)
  const unchangedActions = (['read', 'update', 'unmask'] as ActionName[]).filter(
    (action) => !impact.changes.some((c) => c.action === action),
  )

  return (
    <Modal
      open={open}
      title="Phân tích ảnh hưởng"
      description="Thay đổi này sẽ có hiệu lực ngay ở request tiếp theo."
      onClose={onCancel}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            Xem lại
          </Button>
          <Button onClick={onConfirm} disabled={pending} data-testid="impact-confirm">
            {pending ? 'Đang lưu…' : 'Xác nhận lưu'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <KeyValue label="User bị ảnh hưởng">
            <span className="flex items-center gap-1.5" data-numeric>
              <Users size={14} className="text-ink-subtle" aria-hidden />
              {impact.affectedUsers}
            </span>
          </KeyValue>
          <KeyValue label="Vai trò liên quan">
            <span data-numeric>{impact.affectedRoles}</span>
          </KeyValue>
          <KeyValue label="Màn hình liên quan">
            <span data-numeric>{impact.affectedScreens}</span>
          </KeyValue>
        </div>

        {impact.changes.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Không có phạm vi nào thay đổi. Quyền hiệu lực của mọi user giữ nguyên.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-card border border-line" data-testid="impact-changes">
            {impact.changes.map((change) => (
              <li
                key={`${change.fieldName}-${change.action}`}
                className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm"
              >
                <span className="font-medium text-ink">{change.fieldName}</span>
                <Badge tone="neutral">{ACTION_LABELS[change.action]}</Badge>
                <span className="text-ink-muted">{scopeList(change.from)}</span>
                <ArrowRight size={13} className="text-ink-subtle" aria-hidden />
                <span className="font-medium text-ink">{scopeList(change.to)}</span>
                {change.widening ? (
                  <Badge tone="caution">Mở rộng</Badge>
                ) : (
                  <Badge tone="positive">Thu hẹp</Badge>
                )}
              </li>
            ))}
          </ul>
        )}

        {unchangedActions.length > 0 && (
          <p className="text-sm text-ink-muted">
            Giữ nguyên: {unchangedActions.map((a) => ACTION_LABELS[a]).join(', ')}.
          </p>
        )}

        {impact.warnings.length > 0 && (
          <ul className="space-y-1.5" data-testid="impact-warnings">
            {impact.warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-caution-700">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
                {warning.message}
              </li>
            ))}
          </ul>
        )}

        {widening.length > 0 && impact.affectedUsernames.length > 0 && (
          <p className="text-xs text-ink-subtle">
            User đang giữ vai trò: {impact.affectedUsernames.join(', ')}
          </p>
        )}
      </div>
    </Modal>
  )
}
