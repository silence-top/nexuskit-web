/// <reference path="../global.d.ts"/>

/** 用户数据库表字段 */
namespace Entity {

  interface Question {
    /** 单位id */
    id?: string
    /** 单位id名 */
    title?: string
    /** 单位地址 */
    keys?: Array<string>
    /* 父级id */
    content: string
    /** 单位id */
    company_id?: string
    /** 创建时间 */
    create_time?: string
    /** 更新 */
    update_time?: string
    /** 用户状态 */
    status?: 0 | 1
    /** 备注 */
    description?: string
  }

}
