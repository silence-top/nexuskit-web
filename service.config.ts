/** 不同请求服务的环境配置 */
export const serviceConfig: Record<ServiceEnvType, Record<string, string>> = {
  dev: {
    url: 'http://127.0.0.1:8000',
    // url: 'https://api.lscstory.cn/admin',
  },

  test: {
    url: 'https://mock.apifox.cn/m1/4071143-0-default',
  },
  prod: {
    url: 'https://api.lscstory.cn/admin',
  },
}
