import type { Router } from 'vue-router'
import { useAppStore, useAuthStore, useRouteStore, useTabStore } from '@/store'
import { local } from '@/utils'

const title = import.meta.env.VITE_APP_NAME

export function setupRouterGuard(router: Router) {
  const appStore = useAppStore()
  const authStore = useAuthStore()
  const routeStore = useRouteStore()
  const tabStore = useTabStore()

  router.beforeEach(async (to, from, next) => {
    // 判断是否是外链，如果是直接打开网页并拦截跳转
    if (to.meta.href) {
      window.open(to.meta.href)
      return false
    }
    // 开始 loadingBar
    appStore.showProgress && window.$loadingBar?.start()

    // 判断有无TOKEN,登录鉴权
    const isLogin = Boolean(local.get('accessToken'))
    if (!isLogin) {
      // 已在登录页，直接放行（不能再 return false，否则取消自身导航死循环）
      if (to.name === 'login')
        return next()
      // 未登录，跳转登录页
      const redirect = to.name === '404' ? undefined : to.fullPath
      return next({ path: '/login', query: { redirect } })
    }

    // 判断路由有无进行初始化
    if (!routeStore.isInitAuthRoute) {
      await routeStore.initAuthRoute()
      // 初始化失败（接口报错、权限不足等），强制退出避免死循环
      if (!routeStore.isInitAuthRoute) {
        await authStore.logout()
        return false
      }
      // 动态路由加载完回到根路由
      if (to.name === '404') {
      // 等待权限路由加载好了，回到之前的路由,否则404
        next({
          path: to.fullPath,
          replace: true,
          query: to.query,
          hash: to.hash,
        })
        return false
      }
    }

    // 判断当前页是否在login,则定位去首页
    if (to.name === 'login') {
      next({ path: '/' })
      return false
    }

    next()
  })
  router.beforeResolve((to) => {
    // 设置菜单高亮
    routeStore.setActiveMenu(to.meta.active_menu ?? to.fullPath)
    // 添加tabs
    tabStore.addTab(to)
    // 设置高亮标签;
    tabStore.setCurrentTab(to.fullPath as string)
  })

  router.afterEach((to) => {
    // 修改网页标题
    document.title = `${to.meta.title} - ${title}`
    // 结束 loadingBar
    appStore.showProgress && window.$loadingBar?.finish()
  })
}
