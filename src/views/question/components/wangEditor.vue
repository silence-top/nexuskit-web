<script lang="ts" setup>
import type { SlateElement } from '@wangeditor/editor'
import { generateProxyPattern } from '@/../build/proxy'
import { serviceConfig } from '@/../service.config'

import { local } from '@/utils'

import { i18nChangeLanguage } from '@wangeditor/editor'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import '@wangeditor/editor/dist/css/style.css'

// 定义 props 和 emits
const props = defineProps<{
  modelValue: string
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { locale } = useI18n()

if (locale.value === 'zhCN') {
  i18nChangeLanguage('zh-CN')
}
else {
  i18nChangeLanguage('en')
}
// 切换语言 - 'en' 或者 'zh-CN'

type ImageElement = SlateElement & {
  src: string
  alt: string
  url: string
  href: string
}
const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y'

const { url } = generateProxyPattern(serviceConfig[import.meta.env.MODE])

const baseUrl = isHttpProxy ? url.proxy : url.value
const editorRef = shallowRef<any >(null) // Editor instance
const valueHtml = ref<string>(props.modelValue) // Initial content
const disabled = ref<boolean>(props.disabled || false) // Disabled state
const mode = ref<'default' | 'simple'>('default') // Mode of the editor
const toolbarConfig = ref<any>({}) // Toolbar configuration
const insertImages = ref<string[]>([]) // Inserted images

const editorConfig = ref<any>({
  readOnly: disabled.value,
  MENU_CONF: {
    uploadImage: {
      server: `${baseUrl}/upload/content_img`,
      // form-data fieldName ，默认值 'wangeditor-uploaded-image'
      fieldName: 'file',

      // 单个文件的最大体积限制，默认为 2M
      maxFileSize: 1 * 1024 * 1024, // 1M

      // 最多可上传几个文件，默认为 100
      maxNumberOfFiles: 10,

      // 选择文件时的类型限制，默认为 ['image/*'] 。如不想限制，则设置为 []
      allowedFileTypes: ['image/*'],

      // 自定义上传参数，例如传递验证的 token 等。参数会被添加到 formData 中，一起上传到服务端。
      //   meta: {
      //     token: 'xxx',
      //     otherKey: 'yyy',
      //   },

      // 将 meta 拼接到 url 参数中，默认 false
      metaWithUrl: false,

      // 自定义增加 http  header
      headers: {
        Authorization: `Bearer ${local.get('accessToken')}`,
      },

      // 跨域是否传递 cookie ，默认为 false
      withCredentials: false,

      // 超时时间，默认为 10 秒
      timeout: 5 * 1000, // 5 秒
    },
    // 插入图片
    insertImage: {
      onInsertedImage(imageNode: ImageElement | null) {
        console.log(imageNode, 'imageNode')
        // TS 语法
        // onInsertedImage(imageNode) {                    // JS 语法
        if (imageNode == null)
          return

        const { href } = imageNode
        insertImages.value.push(href)

        console.log('Inserted images:', insertImages.value)
      },
      // checkImage: customCheckImageFn, // 也支持 async 函数
      parseImageSrc: (src: string) => {
      // 例如将相对路径转换为绝对路径
        return src
        // return `${src}`
      },
    },

  },
}) // Editor configuration

// Simulate an asynchronous fetch of content=

// Handle editor creation
function handleCreated(editor: any) {
  editorRef.value = editor // Store the editor instance
  editorRef.value.getElemsByType('image').forEach((image: ImageElement) => {
    // href 为传给后台的文件路径

    const { href } = image
    insertImages.value.push(href)
  })
}
defineExpose({
  getDeleteImages,
})
async function getDeleteImages() {
  const deleteImages: string[] = []

  const images: string[] = []
  editorRef.value.getElemsByType('image').forEach((image: ImageElement) => {
    const { href } = image
    images.push(href)
  })
  insertImages.value.forEach((href) => {
    if (!images.includes(href)) {
      deleteImages.push(href)
    }
  })

  return { delete_images: deleteImages, all_images: insertImages.value }
} // Get the images to delete
watch(valueHtml, (newValue) => {
  emit('update:modelValue', newValue)
  // getDeleteImages()
})

// watch(() => props.modelValue, (newValue) => {
//   console.log(newValue, 'aa')
//   valueHtml.value = newValue
// })
// Cleanup editor instance when component is destroyed
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) {
    editor.destroy()
  }
})
</script>

<template>
  <div style="border: 1px solid #ccc">
    <Toolbar
      style="border-bottom: 1px solid #ccc"
      :editor="editorRef"
      :default-config="toolbarConfig"
      :mode="mode"
    />
    <Editor
      v-model="valueHtml"
      style="height: 500px; overflow-y: hidden;width: 100%;"
      :default-config="editorConfig"
      :mode="mode"
      @on-created="handleCreated"
    />
  </div>
</template>
