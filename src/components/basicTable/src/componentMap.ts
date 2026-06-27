import type { Component } from 'vue'
import type { ComponentType } from './types/componentType'
import {
  NCheckbox,
  NDatePicker,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NTimePicker,
} from 'naive-ui'

export enum EventEnum {
  NInput = 'on-input',
  NInputNumber = 'on-input-number',
  NSelect = 'on-update-select',
  NSwitch = 'on-update-switch',
  NCheckbox = 'on-update-checkbox',
  NDatePicker = 'on-update-date-picker',
  NTimePicker = 'on-update-time-picker',
}
const componentMap = new Map<ComponentType, Component>()

componentMap.set('NInput', NInput)
componentMap.set('NInputNumber', NInputNumber)
componentMap.set('NSelect', NSelect)
componentMap.set('NSwitch', NSwitch)
componentMap.set('NCheckbox', NCheckbox)
componentMap.set('NDatePicker', NDatePicker)
componentMap.set('NTimePicker', NTimePicker)

export function add(compName: ComponentType, component: Component) {
  componentMap.set(compName, component)
}

export function del(compName: ComponentType) {
  componentMap.delete(compName)
}

export { componentMap }
