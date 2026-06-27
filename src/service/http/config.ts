import { $t } from '@/utils'
/** 默认实例的Aixos配置 */
export const DEFAULT_ALOVA_OPTIONS = {
  // 请求超时时间,默认15秒
  timeout: 15 * 1000,
}

/** 默认实例的后端字段配置 */
export const DEFAULT_BACKEND_OPTIONS = {
  codeKey: 'code',
  dataKey: 'data',
  msgKey: 'message',
  successCode: 20000, // BizCode.SUCCESS
  createdCode: 20100, // BizCode.CREATED
}

/** 请求不成功各种状态的错误 */
export const ERROR_STATUS = {
  default: $t('http.defaultTip'),
  400: $t('http.400'),
  401: $t('http.401'),
  403: $t('http.403'),
  404: $t('http.404'),
  405: $t('http.405'),
  408: $t('http.408'),
  500: $t('http.500'),
  501: $t('http.501'),
  502: $t('http.502'),
  503: $t('http.503'),
  504: $t('http.504'),
  505: $t('http.505'),
}

/** 不需要错误提示的业务码（静默处理） */
export const ERROR_NO_TIP_STATUS = [
  42901, // REFRESH_CONFLICT：并发刷新 Token 冲突，内部静默处理
]
