/* 存放数据库实体表类型， 具体内容在 ./entities */
declare namespace Entity {
}
declare interface Fn<T = any, R = T> {
  (...arg: T[]): R
}

/* 各类接口返回的数据类型， 具体内容在 ./api */
declare namespace Api {

}

interface Window {
  $loadingBar: import('naive-ui').LoadingBarApi
  $dialog: import('naive-ui').DialogApi
  $message: import('naive-ui').MessageApi
  $notification: import('naive-ui').NotificationApi
}

declare const AMap: any
declare const BMap: any

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent
  export default component
}
declare module 'vuedraggable' {
  const vuedraggable: any
  export default vuedraggable
}

declare interface ChangeEvent extends Event {
  target: HTMLInputElement
}

declare namespace NaiveUI {
  type ThemeColor = 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning'
}
declare type LabelValueOptions = {
  label: string
  value: any
  disabled: boolean
  [key: string]: string | number | boolean
}[]

declare namespace Storage {
  interface Session {
    dict: DictMap
  }

  interface Local {
    /* 存储用户信息 */
    userInfo: Api.Login.Info
    /* 存储访问token */
    accessToken: string
    /* 存储刷新token */
    refreshToken: string
    /* 存储登录账号 */
    loginAccount: any
    /* 存储当前语言 */
    lang: App.lang
  }
}

declare namespace App {
  type lang = 'zhCN' | 'enUS'
}

namespace JSX {
  // tslint:disable no-empty-interface
  type Element = VNode
  // tslint:disable no-empty-interface
  type ElementClass = ComponentRenderProxy

  interface ElementAttributesProperty {
    $props: any
  }

  interface IntrinsicElements {
    [elem: string]: any
  }

  interface IntrinsicAttributes {
    [elem: string]: any
  }
}
interface DictMap {
  [key: string]: Entity.Dict[]
}
declare type Recordable<T = any> = Record<string, T>
declare type Nullable<T> = T | null
