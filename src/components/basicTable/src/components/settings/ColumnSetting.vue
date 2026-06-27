<script lang="ts" setup>
// import { useDesignSetting } from '@/hooks/setting/useDesignSetting'
import { DragOutlined, SettingOutlined, VerticalLeftOutlined, VerticalRightOutlined } from '@vicons/antd'
import { cloneDeep } from 'lodash-es'
import { computed, reactive, ref, toRaw, watchEffect } from 'vue'
import Draggable from 'vuedraggable'
import { useTableContext } from '../../hooks/useTableContext'

interface Options {
  title: string
  key: string
  fixed?: boolean | 'left' | 'right'
}
interface Column {
  title: string
  key: string
  fixed?: boolean | 'left' | 'right'
  [key: string]: any
}

// const { getDarkTheme } = useDesignSetting()
const getDarkTheme = computed(() => false)
const table = useTableContext()
const selection = unref(table.getBindValues).selection
console.log('table', unref(table.getBindValues))

const columnsList = ref<Options[]>([])
const cacheColumnsList = ref<Options[]>([])

const state = reactive({
  selection,
  checkAll: true,
  checkList: [] as string[],
  defaultCheckList: [] as string[],
})

watchEffect(() => {
  const columns = table.getColumns()
  if (columns.length) {
    init()
  }
})

// 初始化
function init() {
  const columns = getColumns()
  const checkList = columns.map(item => item.key as string)
  state.checkList = checkList
  state.defaultCheckList = checkList
  const newColumns = columns
    .filter(item => item.key !== 'action' && item.title !== '操作')
    .map(item => ({
      ...item,
      title: typeof item.title === 'string' ? item.title : '', // 确保 title 是字符串
    }))
  if (!columnsList.value.length) {
    columnsList.value = cloneDeep(newColumns) as Options[]
    cacheColumnsList.value = cloneDeep(newColumns) as Options[]
  }
}

// 切换
function onChange(checkList: any) {
  if (state.selection) {
    checkList.unshift('selection')
  }
  setColumns(checkList)
}

// 设置
function setColumns(columns: any) {
  table.setColumns(columns)
}

// 获取
function getColumns() {
  return table.getColumns().map(item => ({ ...item }))
}

// 重置
function resetColumns() {
  state.checkList = [...state.defaultCheckList]
  state.checkAll = true

  const cacheColumnsKeys = table.getCacheColumns()

  const newColumns = cacheColumnsKeys.map((item: Column) => ({ ...item, fixed: undefined }))
  setColumns(newColumns)
  columnsList.value = newColumns
}

// 全选
function onCheckAll(e: any) {
  const checkList = table.getCacheColumns(true)
  if (e) {
    setColumns(checkList)
    state.checkList = checkList
  }
  else {
    setColumns([])
    state.checkList = []
  }
}

// 拖拽排序
function draggableEnd() {
  const newColumns = toRaw(columnsList.value)
  columnsList.value = newColumns
  setColumns(newColumns)
}

// 勾选列
function onSelection(e: any) {
  const checkList = table.getCacheColumns()
  if (e) {
    checkList.unshift({ type: 'selection', key: 'selection' })
    setColumns(checkList)
  }
  else {
    checkList.splice(0, 1)
    setColumns(checkList)
  }
}

function onMove(e: any) {
  return e.draggedContext.element.draggable !== false
}

// 固定列
function fixedColumn(item: Column, fixed: any) {
  if (!state.checkList.includes(item.key))
    return
  const columns = getColumns()
  const isFixed = item.fixed === fixed ? undefined : fixed
  const index = columns.findIndex(res => res.key === item.key)
  if (index !== -1) {
    columns[index].fixed = isFixed
  }
  table.setCacheColumnsField(item.key, { fixed: isFixed })
  columnsList.value[index].fixed = isFixed
  setColumns(columns)
}
</script>

<template>
  <n-tooltip trigger="hover">
    <template #trigger>
      <div class="cursor-pointer table-toolbar-right-icon">
        <n-popover trigger="click" :width="230" class="toolbar-popover" placement="bottom-end">
          <template #trigger>
            <n-icon size="18">
              <SettingOutlined />
            </n-icon>
          </template>
          <template #header>
            <div class="table-toolbar-inner-popover-title">
              <n-space>
                <n-checkbox v-model:checked="state.checkAll" @update:checked="onCheckAll">
                  {{ $t('table.display') }}
                </n-checkbox>
                <n-checkbox v-model:checked="state.selection" @update:checked="onSelection">
                  {{ $t('table.tick') }}
                </n-checkbox>
                <n-button text type="info" size="small" class="mt-1" @click="resetColumns">
                  {{ $t('table.reset') }}
                </n-button>
              </n-space>
            </div>
          </template>
          <div class="table-toolbar-inner">
            <n-checkbox-group v-model:value="state.checkList" @update:value="onChange">
              <Draggable
                v-model="columnsList"
                animation="300"
                item-key="key"
                filter=".no-draggable"
                :move="onMove"
                @end="draggableEnd"
              >
                <template #item="{ element }">
                  <div
                    class="table-toolbar-inner-checkbox"
                    :class="{
                      'table-toolbar-inner-checkbox-dark': getDarkTheme === true,
                      'no-draggable': element.draggable === false,
                    }"
                  >
                    <span
                      class="drag-icon"
                      :class="{ 'drag-icon-hidden': element.draggable === false }"
                    >
                      <n-icon size="18">
                        <DragOutlined />
                      </n-icon>
                    </span>
                    <n-checkbox :value="element.key" :label="element.title" />
                    <div class="fixed-item">
                      <n-tooltip trigger="hover" placement="bottom">
                        <template #trigger>
                          <n-icon
                            size="18"
                            :color="element.fixed === 'left' ? '#2080f0' : undefined"
                            class="cursor-pointer"
                            @click="fixedColumn(element, 'left')"
                          >
                            <VerticalRightOutlined />
                          </n-icon>
                        </template>
                        <span>{{ $t('table.fixed_left') }}</span>
                      </n-tooltip>
                      <n-divider vertical />
                      <n-tooltip trigger="hover" placement="bottom">
                        <template #trigger>
                          <n-icon
                            size="18"
                            :color="element.fixed === 'right' ? '#2080f0' : undefined"
                            class="cursor-pointer"
                            @click="fixedColumn(element, 'right')"
                          >
                            <VerticalLeftOutlined />
                          </n-icon>
                        </template>
                        <span>{{ $t('table.fixed_right') }}</span>
                      </n-tooltip>
                    </div>
                  </div>
                </template>
              </Draggable>
            </n-checkbox-group>
          </div>
        </n-popover>
      </div>
    </template>
    <span>{{ $t('table.column_setting') }}</span>
  </n-tooltip>
</template>

<style lang="scss">
.table-toolbar {
  &-inner-popover-title {
    padding: 3px 0;
  }

  &-right {
    &-icon {
      margin-left: 12px;
      font-size: 16px;
      color: var(--text-color);
      cursor: pointer;

      :hover {
        color: #1890ff;
      }
    }
  }
}

.table-toolbar-inner {
  &-checkbox {
    display: flex;
    align-items: center;
    padding: 10px 14px;

    &:hover {
      background: #e6f7ff;
    }

    .drag-icon {
      display: inline-flex;
      margin-right: 8px;
      cursor: move;
      &-hidden {
        visibility: hidden;
        cursor: default;
      }
    }

    .fixed-item {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-left: auto;
    }

    .ant-checkbox-wrapper {
      flex: 1;

      &:hover {
        color: #1890ff !important;
      }
    }
  }

  &-checkbox-dark {
    &:hover {
      background: hsla(0, 0%, 100%, 0.08);
    }
  }
}

.toolbar-popover {
  .n-popover__content {
    padding: 0;
  }
}
</style>
