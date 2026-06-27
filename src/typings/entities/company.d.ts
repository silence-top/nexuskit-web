/// <reference path="../global.d.ts"/>

/** 用户数据库表字段 */
namespace Entity {

  interface Company {
    /** 单位id */
    id?: string
    /** 单位id名 */
    name?: string
    /** 单位地址 */
    address?: string
    /* 父级id */
    parent_id?: string
    /* 入职时间 */
    onboarding_time?: string | null
    /* 离职时间 */
    separation_time?: string | null
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
