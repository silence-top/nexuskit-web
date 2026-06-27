import { inject, provide } from 'vue'

const key = Symbol('formElRef')

export function createFormContext(instance: any) {
  provide(key, instance)
}

export function useFormContext() {
  return inject(key)
}
