import { router } from '@/router'
import { fetchLogin, fetchLogout } from '@/service'
import { local } from '@/utils'
import { useRouteStore } from './router'
import { useTabStore } from './tab'

export const useAuthStore = defineStore('auth-store', () => {
  // state
  const userInfo = ref<Api.Login.Info | null>(local.get('userInfo'))
  const token = ref(local.get('accessToken') || '')
  /** 防止 logout 并发重复执行 */
  let _isLoggingOut = false

  // getters
  /** 是否登录 */
  const isLogin = computed(() => Boolean(token.value))

  // actions
  function clearAuthStorage() {
    local.remove('accessToken')
    local.remove('refreshToken')
    local.remove('userInfo')
  }

  function $reset() {
    userInfo.value = null
    token.value = ''
  }

  /* 登录退出，重置用户信息等 */
  async function logout() {
    if (_isLoggingOut)
      return
    _isLoggingOut = true
    try {
      // 在清除存储前记录当前路由（后续作为 redirect）
      const route = unref(router.currentRoute)

      // 先发登出请求（此时 token 还在 localStorage，assignToken 能正确填入）
      // 不 await：登出请求失败/超时不能阻塞后续清缓存和跳转
      fetchLogout().catch(() => {})

      // 清除本地缓存
      clearAuthStorage()
      // 清空路由、菜单等数据
      const routeStore = useRouteStore()
      routeStore.resetRouteStore()
      // 清空标签栏数据
      const tabStore = useTabStore()
      tabStore.clearAllTabs()
      // 重置当前存储库
      $reset()
      // 重定向到登录页（如果当前已在登录页则不重复跳转，避免出现 redirect=/login 循环）
      if (route.name !== 'login') {
        const redirect = route.name === '404' ? undefined : route.fullPath
        router.push({
          name: 'login',
          query: redirect ? { redirect } : {},
        })
      }
    }
    finally {
      _isLoggingOut = false
    }
  }

  /* 用户登录 */
  async function login(username: string, password: string) {
    try {
      const { isSuccess, data } = await fetchLogin({ username, password })
      if (!isSuccess)
        return
      console.log('[Login Data]:', data)

      // 处理登录信息
      await handleLoginInfo(data)
    }
    catch (e) {
      console.warn('[Login Error]:', e)
    }
  }

  /* 处理登录返回的数据 */
  async function handleLoginInfo(data: Api.Login.Info) {
    // 将token和userInfo保存下来
    // local.set('userInfo', data)
    local.set('accessToken', data.access_token)
    local.set('refreshToken', data.refresh_token)
    token.value = data.access_token
    userInfo.value = data

    // 添加路由和菜单
    const routeStore = useRouteStore()
    await routeStore.initAuthRoute()

    // 进行重定向跳转
    const route = unref(router.currentRoute)
    const query = route.query as { redirect: string }
    router.push({
      path: query.redirect || '/',
    })
  }

  return {
    userInfo,
    token,
    isLogin,
    logout,
    clearAuthStorage,
    login,
    handleLoginInfo,
    $reset,
  }
})
