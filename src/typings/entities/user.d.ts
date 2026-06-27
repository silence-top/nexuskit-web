/// <reference path="../global.d.ts"/>

namespace Entity {
  interface User {
    id?: number
    /** 用户名 */
    username?: string
    /** 邮箱 */
    email?: string | null
    /** 手机号 */
    phone?: string | null
    /** 国际区号 */
    phone_code?: string
    /** 是否启用 */
    is_active?: boolean
    /** 所属部门 ID */
    dept_id?: number | null
    /** 是否开启 MFA */
    is_mfa_enabled?: boolean
  }

  /** 用户-应用平台授权绑定 */
  interface UserApp {
    user_id: number
    app_code: string
    /** 是否启用 */
    is_active: boolean
    /** 过期时间，null=永久 */
    expired_at: string | null
    /** 授权时间 */
    created_at: string
  }
}
