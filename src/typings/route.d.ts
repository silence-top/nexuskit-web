declare namespace AppRoute {

  type menu_type = 'directory' | 'page' | 'button'
  /** 菜单类型码（M=目录 C=菜单 F=按鈕 L=外链） */
  type MenuTypeCode = 'M' | 'C' | 'F' | 'L'

  // ─── 后端新格式返回类型 ────────────────────────────────
  interface ApiMenuMeta {
    title: string
    icon?: string
    order?: number
    /** 菜单类型 M=目录 C=菜单 F=按鈕 */
    type: 'M' | 'C' | 'F'
    keepAlive?: boolean
  }

  interface ApiMenuItem {
    id: number
    parent_id: number | null
    name: string
    path: string | null
    component: string | null
    is_ext: boolean
    ext_url: string | null
    meta: ApiMenuMeta
    children: ApiMenuItem[]
  }

  interface ApiMenuData {
    roles: string[]
    menu_tree: ApiMenuItem[]
    /** 按鈕权限标识列表 */
    buttons: string[]
  }

  /** [Admin] 管理后台使用的平铺菜单节点（对应 GET /api/identity/menus 返回） */
  interface AdminMenu {
    id: number
    app_code: string
    parent_id: number | null
    /** 权限标识码，如 sys:user:add */
    code: string
    /** 菜单/按鈕显示名称 */
    name: string
    /** M=目录 C=菜单 F=按鈕 L=外链 */
    type: MenuTypeCode
    path?: string | null
    component?: string | null
    is_ext: boolean
    ext_url?: string | null
    icon?: string | null
    sort: number
    is_visible: boolean
    is_active: boolean
    children?: AdminMenu[]
  }
  // ──────────────────────────────────────────────────────
  /** 单个路由所携带的meta标识 */
  interface RouteMeta {
    /* 页面名称 */
    t_name?: string
    /* 页面标题，通常必选。 */
    title: string
    /* 图标，一般配合菜单使用 */
    icon?: string
    /* 是否需要登录权限。 */
    requires_auth?: boolean
    /* 是否开启页面缓存 */
    keep_alive?: boolean
    /* 有些路由我们并不想在菜单中显示，比如某些编辑页面。 */
    hidden?: boolean
    /* 菜单排序。 */
    order?: number
    /* 嵌套外链  */
    href?: string
    /** 当前路由不在左侧菜单显示，但需要高亮某个菜单的情况 */
    active_menu?: string
    /** 当前路由是否会被添加到Tab中 */
    without_tab?: boolean
    /** 当前路由是否会被固定在Tab中,用于一些常驻页面 */
    pin_tab?: boolean
    /** 当前路由在左侧菜单是目录还是页面,不设置默认为page */
    menu_type?: menu_type
    /** 如果是按钮，需要设置permission_key */
    permission_key?: string
  }

  type MetaKeys = keyof RouteMeta

  interface baseRoute {
    /** 路由名称(路由唯一标识) */
    name: string
    /** 路由路径 */
    path: string
    /** 路由重定向 */
    redirect?: string
    /* 页面组件地址 */
    component_path?: string | null
    /* 路由id */
    id: string
    /* 父级路由id，顶级页面为null */
    parent_id: string | null
  }

  /** 单个路由的类型结构(动态路由模式：后端返回此类型结构的路由) */
  type RowRoute = RouteMeta & baseRoute

  /**
   * 挂载到项目上的真实路由结构
   */
  interface Route extends baseRoute {
    /** 子路由 */
    children?: Route[]
    /* 页面组件 */
    component: any
    /** 路由描述 */
    meta: RouteMeta

  }

}
