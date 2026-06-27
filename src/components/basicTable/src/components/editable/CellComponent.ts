import type { FunctionalComponent } from 'vue'
import type { ComponentType } from '../../types/componentType'
import { componentMap } from '@/components/basicTable/src/componentMap'
import { NPopover } from 'naive-ui'
import { h } from 'vue'

export interface ComponentProps {
  component: ComponentType
  rule: boolean
  popoverVisible: boolean
  ruleMessage: string
}

export const CellComponent: FunctionalComponent<ComponentProps> = (props, { attrs }) => {
  const { component = 'NInput', rule = true, ruleMessage, popoverVisible } = props
  const Comp = componentMap.get(component)

  if (!Comp) {
    throw new Error(`Component ${component} not found in componentMap`)
  }

  const DefaultComp = h(Comp, attrs)
  if (!rule) {
    return DefaultComp
  }
  return h(
    NPopover,
    { 'display-directive': 'show', 'show': !!popoverVisible, 'manual': 'manual' },
    {
      trigger: () => DefaultComp,
      default: () =>
        h(
          'span',
          {
            style: {
              color: 'red',
              width: '90px',
              display: 'inline-block',
            },
          },
          ruleMessage,
        ),
    },
  )
}
