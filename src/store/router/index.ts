import type { MenuOption } from 'naive-ui'
import { router } from '@/router'
import { staticRoutes } from '@/router/routes.static'
import { fetchUserRoutes } from '@/service'
import { useAuthStore } from '@/store/auth'
import { $t, local } from '@/utils'
import { createMenus, createRoutes, flattenMenuTree, generateCacheRoutes } from './helper'

export const useRouteStore = defineStore('route-store', () => {
  // state
  const isInitAuthRoute = ref(false)
  const active_menu = ref<string | null>(null)
  const menus = ref<MenuOption[]>([])
  const rowRoutes = ref<AppRoute.RowRoute[]>([])
  const cacheRoutes = ref<string[]>([])
  const permission_keys = ref<string[]>([])
  /** 当前用户的角色编码列表（含 super_admin 判断） */
  const roles = ref<string[]>([])

  // actions
  function resetRoutes() {
    if (router.hasRoute('appRoot'))
      router.removeRoute('appRoot')
  }

  function resetRouteStore() {
    resetRoutes()
    isInitAuthRoute.value = false
    active_menu.value = null
    menus.value = []
    rowRoutes.value = []
    cacheRoutes.value = []
    permission_keys.value = []
    roles.value = []
  }

  // set the currently highlighted menu key
  function setActiveMenu(key: string) {
    active_menu.value = key
  }

  async function initRouteInfo() {
    if (import.meta.env.VITE_ROUTE_LOAD_MODE === 'dynamic') {
      const accessToken = local.get('accessToken')
      if (!accessToken) {
        const authStore = useAuthStore()
        authStore.logout()
        return
      }

      const { data } = await fetchUserRoutes()
      if (!data)
        return

      // 保存角色列表 + 按钮权限码
      roles.value = data.roles ?? []
      permission_keys.value = data.buttons ?? []

      // 将 menu_tree 展平为 RowRoute[]，过滤掉 F 类型按鈕（已由 buttons 字段单独维护）
      const flatRoutes = flattenMenuTree(data.menu_tree)
        .filter(item => item.menu_type !== 'button')

      return [...staticRoutes, ...flatRoutes]
    }
    else {
      rowRoutes.value = staticRoutes
      return staticRoutes
    }
  }

  async function initAuthRoute() {
    isInitAuthRoute.value = false

    // Initialize route information
    const routes = await initRouteInfo()
    if (!routes) {
      window.$message.error($t(`app.getRouteError`))
      return
    }
    rowRoutes.value = routes

    // Generate actual route and insert
    const appRoute = createRoutes(routes)

    console.log('routes', appRoute)
    router.addRoute(appRoute)

    // Generate side menu
    menus.value = createMenus(routes)

    // Generate the route cache
    cacheRoutes.value = generateCacheRoutes(routes)

    isInitAuthRoute.value = true
  }

  return {
    isInitAuthRoute,
    active_menu,
    menus,
    rowRoutes,
    cacheRoutes,
    permission_keys,
    roles,
    resetRouteStore,
    resetRoutes,
    setActiveMenu,
    initRouteInfo,
    initAuthRoute,
  }
})
