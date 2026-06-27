/// <reference path="../global.d.ts"/>

namespace Entity {
  interface Role {
    id?: number
    /** 所属应用编码 */
    app_code?: string
    /** 角色显示名称 */
    role_name?: string
    /** 角色唯一编码，如 nexuskit:admin */
    role_code?: string
  }
}
