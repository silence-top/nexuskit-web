import { request } from '../http'

interface ILogin {
  username: string
  password: string
}

export function fetchLogin(data: ILogin) {
  const methodInstance = request.Post<Service.ResponseResult<Api.Login.Info>>('/api/auth/login', data)

  methodInstance.meta = {
    authRole: null,
  }
  return methodInstance
}

export function fetchUpdateToken(data: { refresh_token: string }) {
  const method = request.Post<Service.ResponseResult<Api.Login.Info>>('/api/auth/refresh', data)
  // refreshToken 请求：避免进入刷新死循环；silent 避免 refresh 失败时重复弹错提示
  method.meta = {
    authRole: 'refreshToken',
    silent: true,
  }
  return method
}

export function fetchUserRoutes() {
  return request.Get<Service.ResponseResult<AppRoute.ApiMenuData>>('/api/identity/permissions')
}

/** 获取个人信息 */
export function fetchMe() {
  return request.Get<Service.ResponseResult<Entity.User>>('/api/auth/me')
}

/** 更新个人信息 */
export function fetchUpdateMe(params: { email?: string, phone?: string, dept_id?: number | null }) {
  return request.Put<Service.ResponseResult<Entity.User>>('/api/auth/me', params)
}

/** 修改自己密码（需旧密码） */
export function fetchChangeMyPassword(old_password: string, new_password: string) {
  return request.Put<Service.ResponseResult<any>>('/api/auth/me/password', { old_password, new_password })
}

/** 登出（携带有效 token 通知后端撤销会话） */
export function fetchLogout() {
  const method = request.Post<Service.ResponseResult<any>>('/api/auth/logout')
  // token 可能已过期，标记 isExpired:true 防止 401 再次触发刷新流程
  // silent:true 表示该请求失败不弹错误提示（已在登出流程中，避免用户看到误导提示）
  method.meta = { isExpired: true, silent: true }
  return method
}
