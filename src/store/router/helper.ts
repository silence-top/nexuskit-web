import type { MenuOption } from 'naive-ui'
import type { RouteRecordRaw } from 'vue-router'
// import { usePermission } from '@/hooks'
import Layout from '@/layouts/index.vue'
import { $t, arrayToTree, renderIcon } from '@/utils'
import { clone, min, omit, pick } from 'radash'
import { RouterLink } from 'vue-router'

/** 后端菜单类型码 → 前端 menu_type 映射表 */
const MENU_TYPE_MAP: Record<AppRoute.MenuTypeCode, AppRoute.menu_type> = {
  M: 'directory',
  C: 'page',
  F: 'button',
}

/**
 * 将后端返回的 menu_tree 递归展平为 RowRoute[]
 * 用于适配现有 createRoutes / createMenus / generateCacheRoutes 逻辑
 */
export function flattenMenuTree(
  items: AppRoute.ApiMenuItem[],
  result: AppRoute.RowRoute[] = [],
): AppRoute.RowRoute[] {
  for (const item of items) {
    result.push({
      id: String(item.id),
      parent_id: item.parent_id !== null ? String(item.parent_id) : null,
      name: item.name,
      path: item.path ?? '',
      component_path: item.component,
      title: item.meta.title,
      icon: item.meta.icon,
      order: item.meta.order,
      keep_alive: item.meta.keepAlive ?? false,
      menu_type: MENU_TYPE_MAP[item.meta.type] ?? 'page',
      requires_auth: true,
      href: item.is_ext ? (item.ext_url ?? undefined) : undefined,
    })
    if (item.children?.length)
      flattenMenuTree(item.children, result)
  }
  return result
}

const metaFields: AppRoute.MetaKeys[]
  = ['title', 'icon', 'requires_auth', 'keep_alive', 'hidden', 'order', 'href', 'active_menu', 'without_tab', 'pin_tab', 'menu_type']

function standardizedRoutes(route: AppRoute.RowRoute[]) {
  return clone(route).map((i) => {
    const route = omit(i, metaFields)
    Reflect.set(route, 'meta', pick(i, metaFields))
    return route
  }) as AppRoute.Route[]
}

export function createRoutes(routes: AppRoute.RowRoute[]) {
  // const { hasPermission } = usePermission()
  // Structure the meta field
  let resultRouter = standardizedRoutes(routes)

  // Generate routes, no need to import files for those with redirect
  const modules = import.meta.glob('@/views/**/*.vue')
  resultRouter = resultRouter.map((item: AppRoute.Route) => {
    if (item.component_path && !item.redirect)
      item.component = modules[`/src/views${item.component_path}`]
    return item
  })

  // Generate route tree
  resultRouter = arrayToTree(resultRouter) as AppRoute.Route[]

  const appRootRoute: RouteRecordRaw = {
    path: '/appRoot',
    name: 'appRoot',
    redirect: import.meta.env.VITE_HOME_PATH,
    component: Layout,
    meta: {
      title: '',
      icon: 'icon-park-outline:home',
    },
    children: [],
  }

  // Set the correct redirect path for the route
  setRedirect(resultRouter)

  // Insert the processed route into the root route
  appRootRoute.children = resultRouter as unknown as RouteRecordRaw[]
  return appRootRoute
}

// Generate an array of route names that need to be kept alive
export function generateCacheRoutes(routes: AppRoute.RowRoute[]) {
  return routes
    .filter(i => i.keep_alive)
    .map(i => i.name)
}

function setRedirect(routes: AppRoute.Route[]) {
  routes.forEach((route) => {
    if (route.children) {
      if (!route.redirect) {
        // Filter out a collection of child elements that are not hidden
        const visibleChilds = route.children.filter(child => !child.meta.hidden)

        // Redirect page to the path of the first child element by default
        let target = visibleChilds[0]

        // Filter out pages with the order attribute
        const orderChilds = visibleChilds.filter(child => child.meta.order)

        if (orderChilds.length > 0)
          target = min(orderChilds, i => i.meta.order!) as AppRoute.Route

        if (target)
          route.redirect = target.path
      }

      setRedirect(route.children)
    }
  })
}

/* 生成侧边菜单的数据 */
export function createMenus(userRoutes: AppRoute.RowRoute[]) {
  const resultMenus = standardizedRoutes(userRoutes)

  // filter menus that do not need to be displayed
  const visibleMenus = resultMenus.filter(route => !route.meta.hidden)

  // generate side menu
  return arrayToTree(transformAuthRoutesToMenus(visibleMenus))
}

// render the returned routing table as a sidebar
function transformAuthRoutesToMenus(userRoutes: AppRoute.Route[]) {
  // const { hasPermission } = usePermission()

  // console.log(userRoutes)
  // return userRoutes.sort((a, b) => {
  //   if (a.meta && a.meta.order && b.meta && b.meta.order)
  //     return a.meta.order - b.meta.order
  //   else if (a.meta && a.meta.order)
  //     return -1
  //   else if (b.meta && b.meta.order)
  //     return 1
  //   else return 0
  // })
  // Convert to side menu data structure
  return userRoutes.map((item) => {
    const target: MenuOption = {
      id: item.id,
      parent_id: item.parent_id,
      label:
        (!item.meta.menu_type || item.meta.menu_type === 'page')
          ? () =>
              h(
                RouterLink,
                {
                  to: {
                    path: item.path,
                  },
                },
                { default: () => $t(`route.${String(item.name)}`, item.meta.title) },
              )
          : () => $t(`route.${String(item.name)}`, item.meta.title),
      key: item.path,
      icon: item.meta.icon ? renderIcon(item.meta.icon) : undefined,
    }
    return target
  })
}
