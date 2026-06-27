import { fetchDictList } from '@/service'
import { session } from '@/utils'

export const useDictStore = defineStore('dict-store', () => {
  // state
  const dictMap = ref<DictMap>({} as DictMap)
  const isInitDict = ref(false)

  // actions
  function initDict() {
    const dict = session.get('dict')
    if (dict) {
      Object.assign(dictMap.value, dict)
    }
    isInitDict.value = true
  }

  async function getDictByNet(code: string) {
    const { data, isSuccess } = await fetchDictList(code)
    if (isSuccess) {
      Reflect.set(dictMap.value, code, data)
      // 同步至session
      session.set('dict', dictMap.value)
      return data
    }
    else {
      throw new Error(`Failed to get ${code} dictionary from network, check ${code} field or network`)
    }
  }

  async function getDict(code: string) {
    const isExist = Reflect.has(dictMap.value, code)

    if (isExist) {
      return dictMap.value[code]
    }
    else {
      return await getDictByNet(code)
    }
  }

  async function dict(code: string) {
    // 调用前初始化
    if (!dictMap.value) {
      initDict()
    }

    const targetDict = await getDict(code)

    return {
      data: () => targetDict,
      enum: () => Object.fromEntries(targetDict.map(({ value, label }) => [value, label])),
      valueMap: () => Object.fromEntries(targetDict.map(({ value, ...data }) => [value, data])),
      labelMap: () => Object.fromEntries(targetDict.map(({ label, ...data }) => [label, data])),
    }
  }

  return {
    dictMap,
    isInitDict,
    dict,
    getDict,
    getDictByNet,
    initDict,
  }
})
