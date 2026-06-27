<script setup lang="ts">
import type { ActionItem } from '@/components/basicTable'

import { DownOutlined } from '@vicons/antd'
import { computed, toRaw } from 'vue'
// 定义组件的 props
const props = defineProps<{
  actions: ActionItem[]
  dropDownActions?: ActionItem[]
  style: string
  select: Fn
}>()

// 根据 props.style 来决定按钮的类型和文本显示
const actionType = computed(() =>
  props.style === 'button' ? 'default' : props.style === 'text' ? 'primary' : 'default',
)
const actionText = computed(() =>
  props.style === 'button' ? undefined : props.style === 'text' ? true : undefined,
)

// 计算更多按钮的属性
const getMoreProps = computed((): any => ({
  text: actionText.value,
  type: actionType.value,
  size: 'small',
}))

// 计算下拉菜单项
const getDropdownList = computed((): any =>
  (toRaw(props.dropDownActions) || []).map(action => ({
    size: 'small',
    text: actionText.value,
    type: actionType.value,
    ...action,
    ...action.popConfirm,
    onConfirm: action.popConfirm?.confirm,
    onCancel: action.popConfirm?.cancel,
  })),
)

// 计算操作项
const getActions = computed((): any =>
  (toRaw(props.actions) || []).map(action => ({
    size: 'small',
    text: actionText.value,
    type: actionType.value,
    ...action,
    ...(action.popConfirm || {}),
    onConfirm: action.popConfirm?.confirm,
    onCancel: action.popConfirm?.cancel,
    enable: !!action.popConfirm,
  })),
)
</script>

<template>
  <div class="tableAction">
    <div class="flex items-center justify-center">
      <template v-for="(action, _index) in getActions" :key="`${_index}-${action.label}`">
        <!-- 有 popConfirm 的按钒用 NPopconfirm 包裹 -->
        <NPopconfirm
          v-if="action.enable"
          @positive-click="action.onConfirm"
          @negative-click="action.onCancel"
        >
          <template #trigger>
            <NButton v-permission="action.auth ?? []" :size="action.size" :type="action.type" :disabled="action.disabled" class="mx-1">
              {{ action.label }}
              <template v-if="action.icon">
                <NIcon :component="action.icon" />
              </template>
            </NButton>
          </template>
          {{ action.title }}
        </NPopconfirm>
        <!-- 无 popConfirm 的普通按钒 -->
        <NButton v-else v-permission="action.auth ?? []" v-bind="action" class="mx-1">
          {{ action.label }}
          <template v-if="action.icon">
            <NIcon :component="action.icon" />
          </template>
        </NButton>
      </template>
      <NDropdown v-if="props.dropDownActions && getDropdownList.length" trigger="hover" :options="getDropdownList" @select="props.select">
        <slot name="more" />
        <NButton v-if="!$slots.more" v-bind="getMoreProps" class="mx-1" icon-placement="right">
          <div class="flex items-center">
            <span>{{ $t('table.more') }}</span>
            <NIcon size="14" class="ml-1">
              <DownOutlined />
            </NIcon>
          </div>
        </NButton>
      </NDropdown>
    </div>
  </div>
</template>
