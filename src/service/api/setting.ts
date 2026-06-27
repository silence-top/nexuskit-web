import { request } from '../http'

// ── 角色管理（App 维度）──────────────────────────────────────────────────────────

/** 获取指定 App 的角色列表 */
export function fetchRolesByApp(app_code: string) {
  return request.Get<Service.ResponseResult<Entity.Role[]>>(`/api/identity/apps/${app_code}/roles`)
}
/** 新建角色 */
export function fetchCreateRole(app_code: string, params: { role_name: string, role_code: string }) {
  return request.Post<Service.ResponseResult<Entity.Role>>(`/api/identity/apps/${app_code}/roles`, { ...params, app_code })
}
/** 更新角色 */
export function fetchUpdateRole(role_id: number, params: { role_name?: string, role_code?: string }) {
  return request.Put<Service.ResponseResult<Entity.Role>>(`/api/identity/roles/${role_id}`, params)
}
/** 删除角色 */
export function fetchDeleteRole(role_id: number) {
  return request.Delete<Service.ResponseResult<any>>(`/api/identity/roles/${role_id}`)
}
/** 获取角色已绑定的权限节点 */
export function fetchRolePermissions(role_id: number) {
  return request.Get<Service.ResponseResult<{ id: number, code: string, name: string, type: string }[]>>(
    `/api/identity/roles/${role_id}/permissions`,
  )
}
/** 批量设置角色权限（全量替换） */
export function fetchAssignRolePermissions(role_id: number, permission_ids: number[]) {
  return request.Put<Service.ResponseResult<any>>(
    `/api/identity/roles/${role_id}/permissions`,
    { permission_ids },
  )
}

// ── 用户-角色分配 ────────────────────────────────────────────────────────────────

/** 获取用户的角色列表 */
export function fetchUserRoles(user_id: number, app_code?: string) {
  return request.Get<Service.ResponseResult<Entity.Role[]>>(
    `/api/identity/users/${user_id}/roles`,
    app_code ? { params: { app_code } } : {},
  )
}
/** 给用户分配角色 */
export function fetchAssignUserRole(user_id: number, role_id: number) {
  return request.Post<Service.ResponseResult<any>>(
    `/api/identity/users/${user_id}/roles`,
    { role_id },
  )
}
/** 撤销用户的角色 */
export function fetchRevokeUserRole(user_id: number, role_id: number) {
  return request.Delete<Service.ResponseResult<any>>(
    `/api/identity/users/${user_id}/roles/${role_id}`,
  )
}

// ── 部门管理 ─────────────────────────────────────────────────────────────────────

/** 获取所有部门（平铺，前端 arrayToTree） */
export function fetchDeptList() {
  return request.Get<Service.ResponseResult<Entity.Department[]>>('/api/identity/departments')
}
/** 新建部门 */
export function fetchCreateDept(params: Omit<Entity.Department, 'id' | 'children'>) {
  return request.Post<Service.ResponseResult<Entity.Department>>('/api/identity/departments', params)
}
/** 更新部门 */
export function fetchUpdateDept(dept_id: number, params: Partial<Omit<Entity.Department, 'id' | 'children'>>) {
  return request.Put<Service.ResponseResult<Entity.Department>>(`/api/identity/departments/${dept_id}`, params)
}
/** 删除部门 */
export function fetchDeleteDept(dept_id: number) {
  return request.Delete<Service.ResponseResult<any>>(`/api/identity/departments/${dept_id}`)
}

// ── 用户管理 ─────────────────────────────────────────────────────────────────────

/** 获取用户列表（管理员接口，支持分页+搜索） */
export function fetchUserList(params?: { keyword?: string, is_active?: boolean, dept_id?: number, page?: number, page_size?: number }) {
  return request.Get<Service.ResponseResult<Entity.User[]>>('/api/identity/users', { params })
}
/** 新建用户（管理员） */
export function fetchCreateUser(params: { username: string, email: string, password: string, phone?: string, dept_id?: number | null, is_active?: boolean }) {
  return request.Post<Service.ResponseResult<Entity.User>>('/api/identity/users', params)
}
/** 更新用户信息（email/phone/dept_id/is_active，UserAdminUpdate） */
export function fetchUpdateUser(user_id: number, params: { email?: string, phone?: string, dept_id?: number | null, is_active?: boolean }) {
  return request.Put<Service.ResponseResult<Entity.User>>(`/api/identity/users/${user_id}`, params)
}
/** 删除用户（返回 204） */
export function fetchDeleteUser(user_id: number) {
  return request.Delete<Service.ResponseResult<any>>(`/api/identity/users/${user_id}`)
}
/** 重置用户密码（管理员无需旧密码） */
export function fetchResetPassword(user_id: number, new_password: string) {
  return request.Put<Service.ResponseResult<any>>(`/api/identity/users/${user_id}/password`, { new_password })
}
/** 强制用户下线（DELETE /users/{id}/sessions → 204） */
export function fetchForceLogout(user_id: number) {
  return request.Delete<Service.ResponseResult<any>>(`/api/identity/users/${user_id}/sessions`)
}

// ── 用户-平台应用授权管理 ─────────────────────────────────────────────────────

/** 获取用户已授权的应用列表 */
export function fetchUserAppGrants(user_id: number) {
  return request.Get<Service.ResponseResult<Entity.UserApp[]>>(`/api/identity/users/${user_id}/apps`)
}
/** 授权用户访问应用（幂等，已存在则更新） */
export function fetchGrantUserApp(user_id: number, params: { app_code: string, is_active?: boolean, expired_at?: string | null }) {
  return request.Post<Service.ResponseResult<Entity.UserApp>>(`/api/identity/users/${user_id}/apps`, params)
}
/** 更新用户应用授权（启用/禁用、过期时间） */
export function fetchUpdateUserApp(user_id: number, app_code: string, params: { is_active?: boolean, expired_at?: string | null }) {
  return request.Put<Service.ResponseResult<Entity.UserApp>>(`/api/identity/users/${user_id}/apps/${app_code}`, params)
}
/** 撤销用户应用授权 */
export function fetchRevokeUserApp(user_id: number, app_code: string) {
  return request.Delete<Service.ResponseResult<any>>(`/api/identity/users/${user_id}/apps/${app_code}`)
}
