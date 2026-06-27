import { request } from '../http'

export function fetchQuestionList(params: any) {
  return request.Post<Service.ResponseResult<Entity.Question>>('/question/list', params)
}
export function fetchAddQuestion(params: any) {
  return request.Post<Service.ResponseResult<Entity.Question>>('/question/add', params)
}

export function fetchUpdateQuestion(params: any) {
  return request.Put<Service.ResponseResult<Entity.Question>>('/question/update', params)
}
export function fetchDeleteQuestion(params: any) {
  return request.Delete<Service.ResponseResult<Entity.Question>>('/question/del', params)
}
