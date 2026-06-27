<script setup lang="ts">
import type { FormItemRule, TreeSelectOption } from 'naive-ui'
import HelpInfo from '@/components/common/HelpInfo.vue'
import { useBoolean } from '@/hooks'
import { fetchAddRoutes, fetchUpdateRoutes } from '@/service'
import { arrayToTree } from '@/utils'

interface Props {
  modalName?: string
  /** 当前选中的 App Code，新增时自动填入 */
  appCode: string
  /** 当前 App 的平铺菜单列表，用于父级选择器 */
  allMenus: AppRoute.AdminMenu[]
}

const { modalName = '', appCode, allMenus } = defineProps<Props>()

const emit = defineEmits<{
  open: []
  close: []
}>()

const { bool: modalVisible, setTrue: showModal, setFalse: hiddenModal } = useBoolean(false)
const { bool: submitLoading, setTrue: startLoading, setFalse: endLoading } = useBoolean(false)

interface MenuFormModel {
  id?: number
  parent_id: number | null
  code: string
  name: string
  type: AppRoute.MenuTypeCode
  path: string | null
  component: string | null
  is_ext: boolean
  ext_url: string | null
  icon: string | null
  sort: number
  is_visible: boolean
  is_active: boolean
}

const formDefault: MenuFormModel = {
  parent_id: null,
  code: '',
  name: '',
  type: 'C',
  path: null,
  component: null,
  is_ext: false,
  ext_url: null,
  icon: null,
  sort: 0,
  is_visible: true,
  is_active: true,
}

const formModel = ref<MenuFormModel>({ ...formDefault })

type ModalType = 'add' | 'view' | 'edit'
const modalType = shallowRef<ModalType>('add')
const modalTitle = computed(() => {
  const map: Record<ModalType, string> = { add: '添加', view: '查看', edit: '编辑' }
  return `${map[modalType.value]}${modalName}`
})

/** 父级选择树（仅目录/菜单可作为父级） */
const parentTreeOptions = computed<TreeSelectOption[]>(() => {
  const validItems = allMenus
    .filter(m => m.type === 'M' || m.type === 'C')
    .map(m => ({ ...m, children: undefined })) // 剥离 children 避免重复构建树时节点重复
  return arrayToTree(validItems).map(toTreeOption)
})

function toTreeOption(node: any): TreeSelectOption {
  return {
    key: node.id,
    label: node.name,
    children: node.children?.map(toTreeOption),
  }
}

const menuTypeOptions: { label: string, value: AppRoute.MenuTypeCode }[] = [
  { label: 'M — 目录', value: 'M' },
  { label: 'C — 菜单', value: 'C' },
  { label: 'F — 按钮', value: 'F' },
  { label: 'L — 外链', value: 'L' },
]

function showField(...types: AppRoute.MenuTypeCode[]) {
  return types.includes(formModel.value.type)
}

async function openModal(type: ModalType = 'add', data?: AppRoute.AdminMenu) {
  emit('open')
  modalType.value = type
  showModal()
  if (type === 'add') {
    formModel.value = { ...formDefault }
  }
  else if (data) {
    formModel.value = {
      id: data.id,
      parent_id: data.parent_id,
      code: data.code,
      name: data.name,
      type: data.type,
      path: data.path ?? null,
      component: data.component ?? null,
      is_ext: data.is_ext,
      ext_url: data.ext_url ?? null,
      icon: data.icon ?? null,
      sort: data.sort,
      is_visible: data.is_visible,
      is_active: data.is_active,
    }
  }
}

function closeModal() {
  hiddenModal()
  endLoading()
  emit('close')
}

defineExpose({ openModal })

const formRef = ref()
async function submitModal() {
  const handlers: Record<ModalType, () => Promise<boolean>> = {
    async add() {
      const payload = { ...formModel.value }
      await fetchAddRoutes(appCode, payload)
      window.$message.success('新增成功')
      return true
    },
    async edit() {
      const { id, ...rest } = formModel.value
      await fetchUpdateRoutes(id!, rest)
      window.$message.success('编辑成功')
      return true
    },
    async view() { return true },
  }
  await formRef.value?.validate()
  startLoading()
  try {
    const ok = await handlers[modalType.value]()
    if (ok)
      closeModal()
  }
  finally {
    endLoading()
  }
}

const rules: Record<string, FormItemRule | FormItemRule[]> = {
  name: { required: true, message: '请输入名称', trigger: 'blur' },
  code: { required: true, message: '请输入权限标识', trigger: 'blur' },
  type: { required: true, message: '请选择菜单类型', trigger: 'change' },
  path: { required: true, message: '请输入路由路径', trigger: 'blur' },
}
</script>

<template>
  <n-modal
    v-model:show="modalVisible"
    :mask-closable="false"
    preset="card"
    :title="modalTitle"
    class="w-760px"
    :segmented="{ content: true, action: true }"
  >
    <n-form
      ref="formRef"
      :rules="rules"
      label-placement="left"
      :label-width="100"
      :model="formModel"
      :disabled="modalType === 'view'"
    >
      <n-grid :cols="2" :x-gap="18">
        <!-- 父级目录 -->
        <n-form-item-grid-item :span="2" path="parent_id">
          <template #label>
            父级节点
            <HelpInfo message="不选则为顶层节点" />
          </template>
          <n-tree-select
            v-model:value="formModel.parent_id"
            :options="parentTreeOptions"
            clearable
            filterable
            placeholder="请选择父级节点（可选）"
          />
        </n-form-item-grid-item>

        <!-- 名称 -->
        <n-form-item-grid-item :span="1" label="名称" path="name">
          <n-input v-model:value="formModel.name" placeholder="Eg: 用户管理" />
        </n-form-item-grid-item>

        <!-- 菜单类型 -->
        <n-form-item-grid-item :span="1" label="节点类型" path="type">
          <n-radio-group v-model:value="formModel.type" name="menuType">
            <n-space>
              <n-radio v-for="opt in menuTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item-grid-item>

        <!-- 权限标识 -->
        <n-form-item-grid-item :span="2" path="code">
          <template #label>
            权限标识
            <HelpInfo message="全局唯一，菜单建议用路径替代 (如 /system/user)，按钮建议用动作码 (如 sys:user:add)" />
          </template>
          <n-input v-model:value="formModel.code" placeholder="Eg: sys:user:add" />
        </n-form-item-grid-item>

        <!-- 路由路径（目录/菜单/外链） -->
        <n-form-item-grid-item
          v-if="showField('M', 'C', 'L')"
          :span="2"
          :label="formModel.type === 'L' ? '外链地址' : '路由路径'"
          path="path"
        >
          <n-input
            v-model:value="formModel.path"
            :placeholder="formModel.type === 'L' ? 'https://example.com' : '/system/user'"
          />
        </n-form-item-grid-item>

        <!-- 组件路径（仅菜单） -->
        <n-form-item-grid-item v-if="showField('C')" :span="2" label="组件路径" path="component">
          <n-input v-model:value="formModel.component" placeholder="Eg: system/user/index" />
        </n-form-item-grid-item>

        <!-- 图标（目录/菜单/外链） -->
        <n-form-item-grid-item v-if="showField('M', 'C', 'L')" :span="1" label="图标" path="icon">
          <icon-select v-model:value="formModel.icon" :disabled="modalType === 'view'" />
        </n-form-item-grid-item>

        <!-- 排序 -->
        <n-form-item-grid-item :span="1" path="sort">
          <template #label>
            排序
            <HelpInfo message="数字越小越靠前" />
          </template>
          <n-input-number v-model:value="formModel.sort" :min="0" class="w-full" />
        </n-form-item-grid-item>

        <!-- 外链开关（仅菜单类型） -->
        <n-form-item-grid-item v-if="showField('C')" :span="1" path="is_ext">
          <template #label>
            外链
            <HelpInfo message="开启后将在新标签页打开 path 指向的外部地址" />
          </template>
          <n-switch v-model:value="formModel.is_ext" />
        </n-form-item-grid-item>

        <!-- 菜单可见 -->
        <n-form-item-grid-item :span="1" label="侧边可见" path="is_visible">
          <n-switch v-model:value="formModel.is_visible" />
        </n-form-item-grid-item>

        <!-- 启用 -->
        <n-form-item-grid-item :span="1" label="启用" path="is_active">
          <n-switch v-model:value="formModel.is_active" />
        </n-form-item-grid-item>
      </n-grid>
    </n-form>

    <template v-if="modalType !== 'view'" #action>
      <n-space justify="center">
        <n-button @click="closeModal">
          取消
        </n-button>
        <n-button type="primary" :loading="submitLoading" @click="submitModal">
          提交
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped></style>
