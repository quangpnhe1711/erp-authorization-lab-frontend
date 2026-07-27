import { useQuery } from '@tanstack/react-query'
import { labApi } from './api'

const STALE = 30_000

export const useVocabulary = () =>
  useQuery({ queryKey: ['lab', 'scopes'], queryFn: labApi.vocabulary, staleTime: Infinity })

export const useLabRoles = () =>
  useQuery({ queryKey: ['lab', 'roles'], queryFn: labApi.roles, staleTime: STALE })

export const useLabModules = () =>
  useQuery({ queryKey: ['lab', 'modules'], queryFn: labApi.modules, staleTime: STALE })

export const useLabScreens = () =>
  useQuery({ queryKey: ['lab', 'screens'], queryFn: labApi.screens, staleTime: STALE })

export const useLabFields = () =>
  useQuery({ queryKey: ['lab', 'fields'], queryFn: labApi.fields, staleTime: STALE })

export const useLabFieldGroups = () =>
  useQuery({ queryKey: ['lab', 'field-groups'], queryFn: labApi.fieldGroups, staleTime: STALE })

export const useLabUsers = () =>
  useQuery({ queryKey: ['lab', 'users'], queryFn: labApi.users, staleTime: STALE })

export const useLabDashboard = () =>
  useQuery({ queryKey: ['lab', 'dashboard'], queryFn: labApi.dashboard })

export const useLabAudit = (limit = 100, roleCode?: string) =>
  useQuery({
    queryKey: ['lab', 'audit', limit, roleCode ?? null],
    queryFn: () => labApi.auditEvents({ limit, roleCode }),
  })

export const useRoleScreenConfig = (roleCode: string | null, screenKey: string | null) =>
  useQuery({
    queryKey: ['lab', 'role-screen-config', roleCode, screenKey],
    queryFn: () => labApi.roleScreenConfig(roleCode!, screenKey!),
    enabled: Boolean(roleCode && screenKey),
  })
