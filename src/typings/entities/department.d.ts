/// <reference path="../global.d.ts"/>

namespace Entity {
  interface Department {
    id?: number
    /** 部门名称 */
    dept_name?: string
    /** 父部门 ID，null 表示根部门 */
    parent_id?: number | null
    /** 排序权重，越小越靠前 */
    sort?: number
    /** 部门负责人 */
    leader?: string | null
    /** 联系电话 */
    phone?: string | null
    /** 联系邮箱 */
    email?: string | null
    /** 是否启用 */
    is_active?: boolean
    /** 子部门（前端组装树时使用） */
    children?: Department[]
  }

  interface PageParams {
    query: Record<string, any>
    page?: number
    page_size?: number
  }
}
