import { request } from '../http'

// 获取指定 App 的菜单列表（平铺，管理后台使用）
export function fetchAllRoutes(app_code: string) {
  return request.Get<Service.ResponseResult<AppRoute.AdminMenu[]>>(`/api/identity/apps/${app_code}/menus`)
}
// 新增路由菜单（app_code 作为路径参数，不再放入 body）
export function fetchAddRoutes(app_code: string, params: any) {
  return request.Post<Service.ResponseResult<AppRoute.RowRoute>>(`/api/identity/apps/${app_code}/menus`, params)
}
// 更新路由菜单
export function fetchUpdateRoutes(menu_id: number | string, params: any) {
  return request.Put<Service.ResponseResult<AppRoute.RowRoute>>(`/api/identity/menus/${menu_id}`, params)
}
// 删除路由菜单
export function fetchDeleteRoutes(menu_id: number | string) {
  return request.Delete<Service.ResponseResult<any>>(`/api/identity/menus/${menu_id}`)
}

/**
 * 请求获取字典列表
 *
 * @param code - 字典编码，用于筛选特定的字典列表
 * @returns 返回的字典列表数据
 */
export function fetchDictList(code?: string) {
  const params = { code }
  return request.Get<Service.ResponseResult<Entity.Dict[]>>('/dict/list', { params })
}

// 应用管理
export function fetchAppList() {
  return request.Get<Service.ResponseResult<Entity.App[]>>('/api/identity/apps')
}
export function fetchAddApp(params: Omit<Entity.App, 'id' | 'created_at' | 'updated_at'>) {
  return request.Post<Service.ResponseResult<Entity.App>>('/api/identity/apps', params)
}
export function fetchUpdateApp(app_code: string, params: Partial<Omit<Entity.App, 'id' | 'app_code' | 'created_at' | 'updated_at'>>) {
  return request.Put<Service.ResponseResult<Entity.App>>(`/api/identity/apps/${app_code}`, params)
}
export function fetchDeleteApp(app_code: string) {
  return request.Delete<Service.ResponseResult<any>>(`/api/identity/apps/${app_code}`)
}
/** 重置应用密鑰（明文仅返回一次） */
export function fetchResetAppSecret(app_code: string) {
  return request.Post<Service.ResponseResult<{ app_secret: string }>>(`/api/identity/apps/${app_code}/secret`)
}
