import { fetchUpdateToken } from '@/service'
import { useAuthStore } from '@/store'
import { local } from '@/utils'
import {
  ERROR_NO_TIP_STATUS,
  ERROR_STATUS,
} from './config'

type ErrorStatus = keyof typeof ERROR_STATUS

/**
 * @description: 处理请求成功，但返回后端服务器报错（HTTP 状态码非 2xx）
 * @param {Response} response
 * @param {any} method 当前请求 method 实例（用于读取 meta.silent 等标记）
 * @return {*}
 */
export async function handleResponseError(response: Response, method?: any) {
  const error: Service.RequestError = {
    errorType: 'Response Error',
    code: 0,
    message: ERROR_STATUS.default,
    data: null,
  }
  const errorCode: ErrorStatus = response.status as ErrorStatus
  const message = ERROR_STATUS[errorCode] || ERROR_STATUS.default
  Object.assign(error, { code: errorCode, message })

  let shouldLogout = false
  let bizCode: number | undefined

  // 尝试解析 4xx/5xx 响应体中的业务码，丰富错误信息
  try {
    const apiData = await response.clone().json()
    bizCode = apiData?.code
    if (bizCode) {
      Object.assign(error, { code: bizCode, message: apiData.message || message })
      // 40303 SESSION_EXPIRED: 会话已失效，强制登出
      if (bizCode === 40303)
        shouldLogout = true
    }
  }
  catch {
    // 非 JSON 响应，忽略解析错误
  }

  // 401 未授权（token 被踢/失效/过期），或 403 但无法解析业务码时兜底，强制登出
  // logout 请求自身不触发，避免循环
  const isLogoutRequest = method?.meta?.isExpired && !method?.meta?.authRole
  if (!isLogoutRequest && (response.status === 401 || (response.status === 403 && !bizCode)))
    shouldLogout = true

  if (shouldLogout) {
    const authStore = useAuthStore()
    await authStore.logout()
    // 已在登出流程，静默处理不弹提示
    return error
  }

  // 静默请求（如 logout / refresh 等已知会因 token 失效报错的请求）不弹提示
  if (!method?.meta?.silent)
    showError(error)
  return error
}

/**
 * @description: 处理 HTTP 200 但业务码失败
 * @param {Record} data 接口返回的后台数据
 * @param {Service} config 后台字段配置
 * @return {*}
 */
export async function handleBusinessError(data: Record<string, any>, config: Required<Service.BackendConfig>) {
  const { codeKey, msgKey } = config
  const error: Service.RequestError = {
    errorType: 'Business Error',
    code: data[codeKey],
    message: data[msgKey],
    data: data.data,
  }

  const code = Number(error.code)

  // 401xx 认证失败 或 40303 会话过期：后端以 200 + 业务码形式通知登录态失效，强制登出
  if ((code >= 40100 && code < 40200) || code === 40303) {
    const authStore = useAuthStore()
    await authStore.logout()
    // 已在登出流程，静默处理不弹提示
    return error
  }

  showError(error)

  return error
}

/**
 * @description: 统一成功和失败返回类型
 * @param {any} data
 * @param {boolean} isSuccess
 * @return {*} result
 */
export function handleServiceResult(data: any, isSuccess: boolean = true) {
  const result = {
    isSuccess,
    errorType: null,
    ...data,
  }
  return result
}

/**
 * @description: 处理接口token刷新
 * 注意：仅负责刷新，失败时 throw，由调用方决定是否登出
 * @return {*}
 */
export async function handleRefreshToken() {
  const isAutoRefresh = import.meta.env.VITE_AUTO_REFRESH_TOKEN === 'Y'
  const refreshToken = local.get('refreshToken')

  // 未开启自动刷新或 refreshToken 不存在，抛出异常由调用方登出
  if (!isAutoRefresh || !refreshToken) {
    throw new Error('Auto refresh not available')
  }

  // 用 refreshToken 换取新 token
  const { data, isSuccess } = await fetchUpdateToken({ refresh_token: refreshToken })
  if (isSuccess && data) {
    local.set('accessToken', data.access_token)
    local.set('refreshToken', data.refresh_token)
    return
  }
  // refreshToken 也已失效（被强制下线 / 服务端踢出 / 过期）
  throw new Error('Refresh token failed')
}

export function showError(error: Service.RequestError) {
  // 如果error不需要提示,则跳过
  const code = Number(error.code)
  if (ERROR_NO_TIP_STATUS.includes(code))
    return

  window.$message.error(error.message)
}
