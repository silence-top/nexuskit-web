/// <reference path="../global.d.ts"/>

/* 角色数据库表字段 */
namespace Entity {

  interface PageParams {
    /** 页码 */
    page?: number
    /** 页码 */
    page_size?: number
    /** 用户名 */
    query?: object
  }
}
