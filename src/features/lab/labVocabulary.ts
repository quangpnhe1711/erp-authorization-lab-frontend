import type { ActionName, PiiClass, ScopeCode, ScopeContainment } from './types'

/** Business-facing names. Technical codes stay available in tooltips and the payload inspector. */
export const SCOPE_LABELS: Record<ScopeCode, string> = {
  NONE: 'Không có',
  SELF: 'Chính mình',
  ASSIGNED: 'Được phân công',
  DIRECT_REPORTS: 'Cấp dưới trực tiếp',
  TEAM: 'Nhóm',
  DEPARTMENT: 'Phòng ban',
  DEPARTMENT_TREE: 'Phòng ban & cấp dưới',
  RESPONSIBILITY: 'Phạm vi phụ trách',
  ALL: 'Toàn bộ',
}

export const ACTION_LABELS: Record<ActionName, string> = {
  read: 'Xem',
  update: 'Sửa',
  unmask: 'Xem giá trị thật',
}

export const PII_LABELS: Record<PiiClass, string> = {
  PUBLIC: 'Công khai',
  INTERNAL: 'Nội bộ',
  CONFIDENTIAL: 'Mật',
  HIGHLY_CONFIDENTIAL: 'Tối mật',
}

export const RESOURCE_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tạo mới',
  DELETE: 'Xoá',
  EXPORT: 'Xuất dữ liệu',
  APPROVE: 'Phê duyệt',
  REJECT: 'Từ chối',
  SUBMIT: 'Gửi duyệt',
  CLOSE: 'Đóng',
  RESOLVE: 'Xử lý xong',
}

export function scopeLabel(scope: ScopeCode | null | undefined): string {
  return scope ? (SCOPE_LABELS[scope] ?? scope) : '—'
}

/**
 * Transitive closure of the declared containment edges, mirroring `RecordScopeLattice` on the client
 * so the editor can grey out a scope the server would reject — same relation, same source data.
 */
export function buildLattice(containments: ScopeContainment[]) {
  const widerThan = new Map<ScopeCode, Set<ScopeCode>>()
  const scopes = new Set<ScopeCode>()
  for (const edge of containments) {
    scopes.add(edge.narrower)
    scopes.add(edge.wider)
  }
  for (const scope of scopes) widerThan.set(scope, new Set([scope]))
  for (const edge of containments) widerThan.get(edge.narrower)?.add(edge.wider)

  let changed = true
  while (changed) {
    changed = false
    for (const scope of scopes) {
      for (const reachable of [...(widerThan.get(scope) ?? [])]) {
        for (const next of widerThan.get(reachable) ?? []) {
          if (!widerThan.get(scope)?.has(next)) {
            widerThan.get(scope)?.add(next)
            changed = true
          }
        }
      }
    }
  }

  return {
    /** True when `narrower`'s record set is provably inside `wider`'s. Unprovable pairs answer false. */
    isProvablyWithin(narrower: ScopeCode | null, wider: ScopeCode | null): boolean {
      if (!narrower || !wider) return false
      return widerThan.get(narrower)?.has(wider) ?? false
    },
  }
}

export type Lattice = ReturnType<typeof buildLattice>
