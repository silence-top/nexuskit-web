import { useAuthStore } from '@/store'
import { local } from '@/utils'
import { createAlova } from 'alova'
import { createServerTokenAuthentication } from 'alova/client'
import adapterFetch from 'alova/fetch'
import VueHook, { type VueHookType } from 'alova/vue'
import {
  DEFAULT_ALOVA_OPTIONS,
  DEFAULT_BACKEND_OPTIONS,
} from './config'
import {
  handleBusinessError,
  handleRefreshToken,
  handleResponseError,
  handleServiceResult,
} from './handle'

const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<VueHookType>({
  // 服务端判定token过期
  refreshTokenOnSuccess: {
    // 当token过期时判定：401 + 非已标记过期 + 非 refreshToken 请求自身（避免 refresh 失败无限循环）
    isExpired: (response, method) => {
      const isExpired = method.meta?.isExpired
      const isRefreshRequest = method.meta?.authRole === 'refreshToken'
      return response.status === 401 && !isExpired && !isRefreshRequest
    },

    // 当token过期时触发：先读取业务码，40101 TOKEN_EXPIRED 或裸 401 才刷新；其他认证失败直接退出
    handler: async (response, method) => {
      // 此处采取限制，防止过期请求无限循环重发
      if (!method.meta)
        method.meta = { isExpired: true }
      else
        method.meta.isExpired = true

      let bizCode: number | undefined
      try {
        const apiData = await response.clone().json()
        bizCode = apiData?.code
      }
      catch {
        // 非 JSON 响应按裸 401 处理
      }

      const authStore = useAuthStore()

      // 40101 TOKEN_EXPIRED 或裸 401：尝试刷新 token
      if (!bizCode || bizCode === 40101) {
        try {
          await handleRefreshToken()
          return
        }
        catch {
          // 刷新失败（refresh token 也失效 / 未开启自动刷新）：强制退出
          await authStore.logout()
          throw new Error('Session expired')
        }
      }

      // 40102~40111 等其他认证失败，或 40303 会话过期：直接退出，不尝试刷新
      await authStore.logout()
      throw new Error('Session expired')
    },
  },
  // 添加token到请求头
  assignToken: (method) => {
    method.config.headers.Authorization = `Bearer ${local.get('accessToken')}`
  },
})

// docs path of alova.js https://alova.js.org/
export function createAlovaInstance(
  alovaConfig: Service.AlovaConfig,
  backendConfig?: Service.BackendConfig,
) {
  const _backendConfig = { ...DEFAULT_BACKEND_OPTIONS, ...backendConfig }
  const _alovaConfig = { ...DEFAULT_ALOVA_OPTIONS, ...alovaConfig }

  return createAlova({
    statesHook: VueHook,
    requestAdapter: adapterFetch(),
    cacheFor: null,
    baseURL: _alovaConfig.baseURL,
    timeout: _alovaConfig.timeout,

    beforeRequest: onAuthRequired((method) => {
      if (method.meta?.isFormPost) {
        method.config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
        method.data = new URLSearchParams(method.data as URLSearchParams).toString()
      }
      alovaConfig.beforeRequest?.(method)
    }),
    responded: onResponseRefreshToken({
      // 请求成功的拦截器
      onSuccess: async (response, method) => {
        const { status } = response

        if (status === 200 || status === 201) {
          // 返回blob数据
          if (method.meta?.isBlob)
            return response.blob()

          // 返回json数据
          const apiData = await response.json()
          // 请求成功：20000 通用成功 / 20100 创建成功
          if (
            apiData[_backendConfig.codeKey] === _backendConfig.successCode
            || apiData[_backendConfig.codeKey] === _backendConfig.createdCode
          ) {
            return handleServiceResult(apiData)
          }

          // 业务请求失败
          const errorResult = await handleBusinessError(apiData, _backendConfig)
          return handleServiceResult(errorResult, false)
        }

        // 204 No Content = 成功，无响应体（DELETE 等接口常用）
        if (status === 204)
          return handleServiceResult({ data: null, code: _backendConfig.successCode })

        // 接口请求失败
        const errorResult = await handleResponseError(response, method)

        return handleServiceResult(errorResult, false)
      },
      onError: (error, method) => {
        console.error(error)
        const tip = `[${method.type}] - [${method.url}] - ${error.message || error.msg || error}`
        window.$message?.warning(tip)
      },

      onComplete: async (_method) => {
        // 处理请求完成逻辑
      },
    }),
  })
}
