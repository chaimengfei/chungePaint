import { get, post } from './request'

/**
 * 获取询价详情
 * @param {string} inquiryNo - 询价单号
 */
export const getInquiryDetail = (inquiryNo) => {
  return get('/api/inquiry/detail', { inquiry_no: inquiryNo }).then(res => res.data)
}

/**
 * 提交询价
 * @param {Object} data 询价数据
 * @param {Array<number>} [data.draft_ids] - 草稿ID列表（从草稿创建询价）
 * @param {number} [data.product_id] - 商品ID（立即询价）
 * @param {number} [data.quantity] - 数量（立即询价，支持小数）
 */
export const submitInquiry = (data) => {
  return post('/api/inquiry/submit', data)
}

/**
 * 获取询价列表
 * @param {Object} params 查询参数
 * @param {number} [params.page] - 页码（默认：1）
 * @param {number} [params.page_size] - 每页数量（默认：10）
 * @param {number} [params.start_time] - 开始时间（Unix时间戳，秒）
 * @param {number} [params.end_time] - 结束时间（Unix时间戳，秒）
 */
export const getInquiryList = (params) => {
  return get('/api/inquiry/list', params).then(res => res.data)
}
