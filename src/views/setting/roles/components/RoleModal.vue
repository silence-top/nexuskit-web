<script setup lang="tsx">
import { useBoolean } from '@/hooks'
import { fetchAssignRolePermissions, fetchRolePermissions } from '@/service'
import { fetchAllRoutes } from '@/service/api/system'
import { arrayToTree } from '@/utils'
import { NTag } from 'naive-ui'

interface Props {
  modalName?: string
  appCode: string
}

const { modalName = '', appCode } = defineProps<Props>()
const emit = defineEmits<{ open: [], close: [] }>()

const { t, locale } = useI18n()
const { bool: modalVisible, setTrue: showModal, setFalse: hiddenModal } = useBoolean(false)
const { bool: submitLoading, setTrue: startLoading, setFalse: endLoading } = useBoolean(false)
const { bool: treeLoading, setTrue: startTreeLoading, setFalse: endTreeLoading } = useBoolean(false)

const currentRole = ref<Entity.Role | null>(null)
const menuTree = ref<any[]>([])
const checkedKeys = ref<number[]>([])

const modalTitle = computed(() => {
  const label = currentRole.value?.role_name ?? modalName
  return locale.value === 'enUS'
    ? `${t('model.edit')} ${label}`
    : `${t('model.edit')} - ${label}`
})

const TYPE_TAG: Record<string, NaiveUI.ThemeColor> = {
  M: 'primary',
  C: 'warning',
  F: 'info',
  L: 'success',
}
const TYPE_LABEL: Record<string, string> = {
  M: '目录',
  C: '菜单',
  F: '按钮',
  L: '外链',
}

function renderLabel({ option }: { option: any }) {
  return option.name
}

function renderPrefix({ option }: { option: any }) {
  const type: string = option.type ?? 'C'
  return (
    <NTag size="small" type={TYPE_TAG[type] ?? 'default'} class="mr-1">
      {TYPE_LABEL[type] ?? type}
    </NTag>
  )
}

async function openModal(role: Entity.Role) {
  emit('open')
  currentRole.value = role
  checkedKeys.value = []
  menuTree.value = []
  showModal()

  startTreeLoading()
  try {
    const [menuRes, permRes] = await Promise.all([
      fetchAllRoutes(appCode),
      fetchRolePermissions(role.id!),
    ])

    const flatMenus = menuRes.data ?? []
    // 剥离后端可能携带的 children，防止重复追加
    menuTree.value = arrayToTree((flatMenus as any[]).map((m: any) => ({ ...m, children: undefined })))

    checkedKeys.value = (permRes.data ?? []).map(p => p.id)
  }
  finally {
    endTreeLoading()
  }
}

function closeModal() {
  hiddenModal()
  endLoading()
  emit('close')
}

defineExpose({ openModal })

async function submitModal() {
  if (!currentRole.value?.id)
    return
  startLoading()
  try {
    await fetchAssignRolePermissions(currentRole.value.id, checkedKeys.value)
    window.$message.success('权限保存成功')
    closeModal()
  }
  finally {
    endLoading()
  }
}
</script>

<template>
  <n-modal
    v-model:show="modalVisible"
    :mask-closable="false"
    preset="card"
    :title="modalTitle"
    class="w-640px"
    :segmented="{ content: true, action: true }"
  >
    <n-spin :show="treeLoading" description="加载中...">
      <n-empty v-if="!treeLoading && menuTree.length === 0" description="该应用暂无菜单数据" class="py-8" />
      <n-tree
        v-else
        v-model:checked-keys="checkedKeys"
        block-line
        checkable
        cascade
        :selectable="false"
        :data="menuTree"
        key-field="id"
        label-field="name"
        :render-label="renderLabel"
        :render-prefix="renderPrefix"
        :default-expand-all="true"
        check-strategy="all"
      />
    </n-spin>
    <template #action>
      <n-space justify="center">
        <n-button @click="closeModal">
          取消
        </n-button>
        <n-button type="primary" :loading="submitLoading" @click="submitModal">
          保存
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
