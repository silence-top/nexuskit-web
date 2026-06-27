import type { InternalRowData, TableBaseColumn } from 'naive-ui/lib/data-table/src/interface'
import type { ComponentType } from './componentType'

export interface BasicColumn<T = InternalRowData> extends TableBaseColumn<T> {
  // 编辑表格
  edit?: boolean
  editRow?: boolean
  editable?: boolean
  editComponent?: ComponentType
  editComponentProps?: Recordable
  editRule?: boolean | ((text: string, record: Recordable) => Promise<string>)
  editValueMap?: (value: any) => string
  onEditRow?: () => void
  // 权限编码控制是否显示
  auth?: string[]
  // 业务控制是否显示
  ifShow?: boolean | ((column: BasicColumn) => boolean)
  // 控制是否支持拖拽，默认支持
  draggable?: boolean
}

export interface TableActionType {
  reload: (opt: any) => Promise<void>
  emit?: any
  getColumns: (opt?: any) => BasicColumn[]
  setColumns: (columns: BasicColumn[] | string[]) => void
  getCacheColumns: (opt?: any) => any
  setCacheColumnsField: (key: string, value: any) => void
}

export interface BasicTableProps {
  title?: string
  dataSource: Fn
  columns: any[]
  pagination: object
  showPagination: boolean
  actionColumn: any[]
  canResize: boolean
  resizeHeightOffset: number
  loading: boolean
  selection?: boolean
  // 新增的属性
  beforeRequest: (...arg: any[]) => void | Promise<any> | null
  request: (...arg: any[]) => Promise<any> | null
  afterRequest: (...arg: any[]) => void | Promise<any> | null
  [key: string]: any

}
