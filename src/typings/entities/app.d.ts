/// <reference path="../global.d.ts"/>

namespace Entity {
  /** 权限模式：full=完整RBAC | role_only=仅角色 | passthru=SSO直通 */
  type AppPermMode = 'full' | 'role_only' | 'passthru'

  interface App {
    id?: number
    /** 应用编码（唯一标识） */
    app_code?: string
    /** 应用名称 */
    app_name?: string
    /** 应用密钥 */
    app_secret?: string
    /** 权限模式 */
    perm_mode?: AppPermMode
    /** 系统描述 */
    description?: string | null
    created_at?: string
    updated_at?: string
  }
}
