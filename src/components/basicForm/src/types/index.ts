import type { ButtonProps } from 'naive-ui/lib/button'
import type { GridItemProps, GridProps } from 'naive-ui/lib/grid'
import type { CSSProperties, VNodeChild } from 'vue'
import type { VueTypesInterface, VueTypeValidableDef } from 'vue-types'
import { createTypes } from 'vue-types'

export interface componentProps {
  options?: any[]
  [key: string]: any
}
export interface FormSchema {
  field: string
  label: string
  labelMessage?: string
  labelMessageStyle?: object | string
  defaultValue?: any
  component?: ComponentType
  componentProps?: componentProps
  slot?: string
  rules?: object | object[]
  giProps?: GridItemProps
  isFull?: boolean
  suffix?: string
}

export interface FormProps {
  model?: Recordable
  labelWidth?: number | string
  schemas?: FormSchema[]
  inline: boolean
  layout?: string
  size: string
  labelPlacement: string
  isFull: boolean
  showActionButtonGroup?: boolean
  showResetButton?: boolean
  resetButtonOptions?: Partial<ButtonProps>
  showSubmitButton?: boolean
  showAdvancedButton?: boolean
  submitButtonOptions?: Partial<ButtonProps>
  submitButtonText?: string
  resetButtonText?: string
  gridProps?: GridProps
  giProps?: GridItemProps
  resetFunc?: () => Promise<void>
  submitFunc?: () => Promise<void>
  submitOnReset?: boolean
  baseGridStyle?: CSSProperties
  collapsedRows?: number
}
export type DynamicProps<T> = {
  [P in keyof T]: Ref<T[P]> | T[P] | ComputedRef<T[P]>;
}
export interface FormActionType {
  submit: () => Promise<any>
  setProps: (formProps: Partial<FormProps>) => Promise<void>
  setSchema: (schemaProps: Partial<FormSchema[]>) => Promise<void>
  setFieldsValue: (values: Recordable) => void
  clearValidate: (name?: string | string[]) => Promise<void>
  getFieldsValue: () => Recordable
  resetFields: () => Promise<void>
  validate: (nameList?: any[]) => Promise<any>
  setLoading: (status: boolean) => void
}

export type RegisterFn = (formInstance: FormActionType) => void
export type VueNode = VNodeChild
export type UseFormReturnType = [RegisterFn, FormActionType]

type PropTypes = VueTypesInterface & {
  readonly style: VueTypeValidableDef<CSSProperties>
  readonly VNodeChild: VueTypeValidableDef<VueNode>
}

const propTypes = createTypes({
  func: undefined,
  bool: undefined,
  string: undefined,
  number: undefined,
  object: undefined,
  integer: undefined,
}) as PropTypes

export const basicProps = {
  // 标签宽度  固定宽度
  labelWidth: {
    type: [Number, String] as PropType<number | string>,
    default: 80,
  },
  // 表单配置规则
  schemas: {
    type: [Array] as PropType<FormSchema[]>,
    default: () => [],
  },
  // 布局方式
  layout: {
    type: String,
    default: 'inline',
  },
  // 是否展示为行内表单
  inline: {
    type: Boolean,
    default: false,
  },
  // 大小
  size: {
    type: String,
    default: 'medium',
  },
  // 标签位置
  labelPlacement: {
    type: String,
    default: 'left',
  },
  // 组件是否width 100%
  isFull: {
    type: Boolean,
    default: true,
  },
  // 是否显示操作按钮（查询/重置）
  showActionButtonGroup: propTypes.bool.def(true),
  // 显示重置按钮
  showResetButton: propTypes.bool.def(true),
  // 重置按钮配置
  resetButtonOptions: Object as PropType<Partial<ButtonProps>>,
  // 显示确认按钮
  showSubmitButton: propTypes.bool.def(true),
  // 确认按钮配置
  submitButtonOptions: Object as PropType<Partial<ButtonProps>>,
  // 展开收起按钮
  showAdvancedButton: propTypes.bool.def(true),
  // 确认按钮文字
  submitButtonText: {
    type: String,
    default: '查询',
  },
  // 重置按钮文字
  resetButtonText: {
    type: String,
    default: '重置',
  },
  // grid 配置
  gridProps: Object as PropType<GridProps>,
  // gi配置
  giProps: Object as PropType<GridItemProps>,
  // grid 样式
  baseGridStyle: {
    type: Object as PropType<CSSProperties>,
  },
  // 是否折叠
  collapsed: {
    type: Boolean,
    default: false,
  },
  // 默认展示的行数
  collapsedRows: {
    type: Number,
    default: 1,
  },
}
export interface FormActionType {
  submit: () => Promise<any>
  setProps: (formProps: Partial<FormProps>) => Promise<void>
  setSchema: (schemaProps: Partial<FormSchema[]>) => Promise<void>
  setFieldsValue: (values: Recordable) => void
  clearValidate: (name?: string | string[]) => Promise<void>
  getFieldsValue: () => Recordable
  resetFields: () => Promise<void>
  validate: (nameList?: any[]) => Promise<any>
  setLoading: (status: boolean) => void
}

export type ComponentType =
  | 'NInput'
  | 'NInputGroup'
  | 'NInputPassword'
  | 'NInputSearch'
  | 'NInputTextArea'
  | 'NInputNumber'
  | 'NInputCountDown'
  | 'NSelect'
  | 'NTreeSelect'
  | 'NRadioButtonGroup'
  | 'NRadioGroup'
  | 'NCheckbox'
  | 'NCheckboxGroup'
  | 'NAutoComplete'
  | 'NCascader'
  | 'NDatePicker'
  | 'NMonthPicker'
  | 'NRangePicker'
  | 'NWeekPicker'
  | 'NTimePicker'
  | 'NSwitch'
  | 'NStrengthMeter'
  | 'NUpload'
  | 'NIconPicker'
  | 'NRender'
  | 'NSlider'
  | 'NRate'
