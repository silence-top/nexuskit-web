<script lang="ts" setup>
import type { PropType } from 'vue'
import type { BasicColumn } from '../../types/table'
import type { EditRecordRow } from './index'
// import { EventEnum } from '@/components/basicTable/src/componentMap'

// import clickOutside from '@/directives/clickOutside'
import { isArray, isBoolean, isFunction, isNumber, isString } from '@/utils'
import { propTypes } from '@/utils/propTypes'

import { CheckOutlined, CloseOutlined, FormOutlined } from '@vicons/antd'

import { format, parseISO } from 'date-fns'

import { omit, set } from 'lodash-es'
import { computed, nextTick, ref, toRaw, unref, watchEffect } from 'vue'
import { useTableContext } from '../../hooks/useTableContext'
import { CellComponent } from './CellComponent'

import { createPlaceholderMessage } from './helper'

// const props = defineProps({
//   value: {
//     type: [String, Number, Boolean, Object],
//     default: '',
//   },
//   record: Object,
//   column: {
//     type: Object,
//     default: () => ({}),
//   },
//   index: propTypes.number,
// })

const props = defineProps({
  value: {
    type: [String, Number, Boolean, Object] as PropType<string | number | boolean | Recordable>,
    default: '',
  },
  record: {
    type: Object as PropType<EditRecordRow>,
  },
  column: {
    type: Object as PropType<BasicColumn>,
    default: () => ({}),
  },
  index: propTypes.number,
})

// const emit = defineEmits<{
//   (e: 'edit-change', payload: { column: any, value: any, record: any }): void
//   (e: 'edit-end', payload: { record: any, index: number, key: string, value: any }): void
//   (e: 'edit-cancel', payload: { record: any, index: number, key: string, value: any }): void
//   (e: 'edit-row-end'): void
// }>()

const table = useTableContext()

const isEdit = ref(false)
const elRef = ref<HTMLElement | null>(null)
const ruleVisible = ref(false)
const ruleMessage = ref('')
const optionsRef = ref<LabelValueOptions[]>([])
const currentValueRef = ref<any>(props.value)
const defaultValueRef = ref<any>(props.value)

const getComponent = computed(() => props.column?.editComponent || 'NInput')
const getRule = computed((): boolean => !!props.column?.editRule)

const getRuleVisible = computed((): boolean => !!ruleMessage.value && !!ruleVisible.value)

const getIsCheckComp = computed(() => {
  const component = getComponent.value
  return ['NCheckbox', 'NRadio'].includes(component)
})
const recordCopy = ref(toRaw(props.record))
const getComponentProps = computed(() => {
  const compProps = props.column?.editComponentProps ?? {}
  const editComponent = props.column?.editComponent ?? null
  const component = getComponent.value
  const apiSelectProps: Recordable = {}

  const isCheckValue = getIsCheckComp.value
  let valueField = isCheckValue ? 'checked' : 'value'
  const val = currentValueRef.value

  let value = isCheckValue ? (isNumber(val) && isBoolean(val) ? val : !!val) : val

  if (component === 'NDatePicker') {
    if (isString(value)) {
      if (compProps.valueFormat) {
        valueField = 'formatted-value'
      }
      else {
        value = parseISO(value as any).getTime()
      }
    }
    else if (isArray(value)) {
      if (compProps.valueFormat) {
        valueField = 'formatted-value'
      }
      else {
        value = value.map(item => parseISO(item).getTime())
      }
    }
  }
  const eventMap: Record<string, string> = {
    NInput: 'on-input',
    NInputNumber: 'on-input',
    NSelect: 'on-update:value',
    NSwitch: 'on-update:value',
    NCheckbox: 'on-update:value',
    NDatePicker: 'on-update:value',
    NTimePicker: 'on-update:value',
  }

  const onEvent: any = editComponent ? (eventMap as any)[editComponent] : undefined

  return {
    placeholder: createPlaceholderMessage(getComponent.value),
    ...apiSelectProps,
    ...omit(compProps, 'onChange'),
    [onEvent]: handleChange,
    [valueField]: value,
  }
})

const getValues = computed(() => {
  const { editComponentProps, editValueMap } = props.column
  const value = currentValueRef.value

  if (editValueMap && isFunction(editValueMap)) {
    return editValueMap(value)
  }

  const component = getComponent.value
  if (!component.includes('NSelect')) {
    return value
  }

  const options = editComponentProps?.options ?? (optionsRef.value || [])
  const option = options.find((item: any) => `${item.value}` === `${value}`)
  return option?.label ?? value
})

const getWrapperClass = computed(() => {
  const { align = 'center' } = props.column
  return `edit-cell-align-${align}`
})

const getRowEditable = computed(() => {
  const { editable } = props.record || {}
  return !!editable
})

watchEffect(() => {
  defaultValueRef.value = props.value
})

watchEffect(() => {
  const { editable } = props.column
  if (isBoolean(editable) || isBoolean(getRowEditable.value)) {
    isEdit.value = !!editable || getRowEditable.value
  }
})

function handleEdit() {
  if (getRowEditable.value || props.column?.editRow)
    return
  ruleMessage.value = ''
  isEdit.value = true
  nextTick(() => {
    const el = elRef.value
    el?.focus?.()
  })
}

async function handleChange(e: any, ...args: any[]) {
  const component = getComponent.value
  const compProps = props.column?.editComponentProps ?? {}
  if (!e) {
    currentValueRef.value = e
  }
  else if (e?.target && Reflect.has(e.target, 'value')) {
    currentValueRef.value = (e as ChangeEvent).target.value
  }
  else if (component === 'NCheckbox') {
    currentValueRef.value = (e as ChangeEvent).target.checked
  }
  else if (isString(e) || isBoolean(e) || isNumber(e)) {
    currentValueRef.value = e
  }

  if (component === 'NDatePicker') {
    if (isNumber(currentValueRef.value)) {
      if (compProps.valueFormat) {
        currentValueRef.value = format(currentValueRef.value, compProps.valueFormat)
      }
    }
    else if (isArray(currentValueRef.value)) {
      if (compProps.valueFormat) {
        currentValueRef.value = currentValueRef.value.map((item) => {
          return format(item, compProps.valueFormat)
        })
      }
    }
  }

  const onChange = props.column?.editComponentProps?.onChange
  if (onChange && isFunction(onChange))
    onChange(...args)

  table.emit?.('edit-change', {
    column: props.column,
    value: currentValueRef.value,
    record: toRaw(props.record),
  })

  await handleSubmiRule()
}
async function handleSubmiRule() {
  const { column, record } = props
  const { editRule } = column
  const currentValue = unref(currentValueRef)

  if (editRule) {
    if (isBoolean(editRule) && !currentValue && !isNumber(currentValue)) {
      ruleVisible.value = true
      const component = unref(getComponent)
      ruleMessage.value = createPlaceholderMessage(component)
      return false
    }
    if (isFunction(editRule)) {
      const res = await editRule(currentValue, record as Recordable)
      if (res) {
        ruleMessage.value = res
        ruleVisible.value = true
        return false
      }
      else {
        ruleMessage.value = ''
        return true
      }
    }
  }
  ruleMessage.value = ''
  return true
}

async function handleSubmit(needEmit = true, valid = true) {
  if (valid) {
    const isPass = await handleSubmiRule()
    if (!isPass)
      return false
  }

  const { column, index, record } = props
  if (!record)
    return false
  const { key } = column
  const value = currentValueRef.value
  if (!key)
    return

  const dataKey = key as string

  set(record, dataKey, value)
  needEmit && table.emit?.('edit-end', { record, index, key, value })
  isEdit.value = false
}

async function handleEnter() {
  if (props.column?.editRow) {
    return
  }
  await handleSubmit()
}

function handleCancel() {
  isEdit.value = false
  currentValueRef.value = defaultValueRef.value
  const { column, index, record } = props
  const { key } = column
  ruleVisible.value = true
  ruleMessage.value = ''
  table.emit?.('edit-cancel', {
    record,
    index,
    key,
    value: currentValueRef.value,
  })
}

function onClickOutside() {
  if (props.column?.editable || getRowEditable.value) {
    return
  }
  const component = getComponent.value

  if (component.includes('NInput')) {
    handleCancel()
  }
}

// only ApiSelect
function handleOptionsChange(options: LabelValueOptions[]) {
  optionsRef.value = options
}

// 修改 initCbs 函数
function initCbs(cbs: 'submitCbs' | 'validCbs' | 'cancelCbs', handle: Fn) {
  if (recordCopy.value) {
    const cbsArray = recordCopy.value[cbs] || []
    if (!isArray(cbsArray)) {
      recordCopy.value[cbs] = [handle]
    }
    else {
      cbsArray.push(handle)
    }
  }
}

// 修改其他地方对 props.record 的引用
if (recordCopy.value) {
  initCbs('submitCbs', handleSubmit)
  initCbs('validCbs', handleSubmiRule)
  initCbs('cancelCbs', handleCancel)

  if (props.column.key) {
    if (!recordCopy.value.editValueRefs)
      recordCopy.value.editValueRefs = {}
    recordCopy.value.editValueRefs[props.column.key] = currentValueRef
  }

  recordCopy.value.onCancelEdit = () => {
    isArray(recordCopy.value?.cancelCbs) && recordCopy.value?.cancelCbs.forEach(fn => fn())
  }

  recordCopy.value.onSubmitEdit = async () => {
    if (isArray(recordCopy.value?.submitCbs)) {
      const validFns = (recordCopy.value?.validCbs || []).map((fn: any) => fn())

      const res = await Promise.all(validFns)

      const pass = res.every(item => !!item)

      if (!pass)
        return
      const submitFns = recordCopy.value?.submitCbs || []
      submitFns.forEach(fn => fn(false, false))
      table.emit?.('edit-row-end')
      return true
    }
  }
}
</script>

<template>
  <div class="editable-cell">
    <div v-if="isEdit" v-click-outside="onClickOutside" class="flex editable-cell-content">
      <div class="editable-cell-content-comp">
        <CellComponent
          v-bind="getComponentProps"
          ref="elRef"
          :component="getComponent"
          :popover-visible="getRuleVisible"
          :rule-message="ruleMessage"
          :rule="getRule"
          :class="getWrapperClass"
          @options-change="handleOptionsChange"
          @press-enter="handleEnter"
        />
      </div>
      <div v-if="!getRowEditable" class="editable-cell-action">
        <n-icon class="mx-2 cursor-pointer" :title="$t('table.save')">
          <CheckOutlined @click="handleSubmit" />
        </n-icon>
        <n-icon class="mx-2 cursor-pointer" :title="$t('table.cancel')">
          <CloseOutlined @click="handleCancel" />
        </n-icon>
      </div>
    </div>
    <div v-else class="flex items-center editable-cell-content" @click="handleEdit">
      {{ getValues }}
      <n-icon v-if="!column.editRow" class="ml-1 edit-icon">
        <FormOutlined />
      </n-icon>
    </div>
  </div>
</template>

<style lang="scss">
.editable-cell {
  &-content {
    position: relative;
    overflow-wrap: break-word;
    word-break: break-word;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    &-comp {
      flex: 1;
    }

    .edit-icon {
      font-size: 14px;
      display: none;
      width: 20px;
      cursor: pointer;
    }

    &:hover {
      .edit-icon {
        display: inline-block;
      }
    }
  }

  &-action {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
