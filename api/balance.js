/**
 * 全局余额状态管理
 * 实现统一状态管理、请求去重和主动刷新机制
 */

import { getUserBalance } from '@/api/user.js'

// 余额状态
const balanceState = {
  balance: 0,           // 当前余额
  isLoading: false,     // 是否正在加载
  lastUpdateTime: 0,    // 最后更新时间
  pendingPromise: null  // 正在进行的请求 Promise（用于去重）
}

// 监听器列表（使用 WeakMap 存储，便于垃圾回收）
const listeners = []
// 最大监听器数量限制（防止内存泄漏）
const MAX_LISTENERS = 50
// 通知防抖定时器
let notifyTimer = null

/**
 * 添加余额变化监听器
 * @param {Function} callback 回调函数
 * @returns {Function} 取消监听的函数
 */
export function onBalanceChange(callback) {
  // 参数验证
  if (typeof callback !== 'function') {
    console.warn('onBalanceChange: callback 必须是函数')
    return () => {}
  }
  
  // 限制监听器数量，防止内存泄漏
  if (listeners.length >= MAX_LISTENERS) {
    console.warn(`余额监听器数量已达上限(${MAX_LISTENERS})，请检查是否有未清理的监听器`)
    // 移除最旧的监听器
    listeners.shift()
  }
  
  // 检查是否已存在相同的监听器（避免重复添加）
  if (listeners.includes(callback)) {
    console.warn('余额监听器已存在，跳过重复添加')
    // 返回取消监听的函数
    return () => {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }
  
  listeners.push(callback)
  // 立即调用一次，传递当前余额（使用 try-catch 防止回调错误影响其他监听器）
  try {
    callback(balanceState.balance)
  } catch (error) {
    console.error('余额监听器初始化调用错误:', error)
  }
  
  // 返回取消监听的函数
  return () => {
    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }
}

/**
 * 通知所有监听器余额已更新（带防抖优化）
 */
function notifyListeners() {
  // 清除之前的定时器
  if (notifyTimer) {
    clearTimeout(notifyTimer)
  }
  
  // 使用防抖，避免频繁更新（50ms内的多次更新只触发一次）
  notifyTimer = setTimeout(() => {
    // 使用 for 循环而不是 forEach，性能更好
    for (let i = 0; i < listeners.length; i++) {
      const callback = listeners[i]
      try {
        callback(balanceState.balance)
      } catch (error) {
        console.error('余额监听器执行错误:', error)
        // 如果监听器出错，移除它（防止错误监听器影响其他监听器）
        listeners.splice(i, 1)
        i-- // 调整索引
      }
    }
    notifyTimer = null
  }, 50) // 50ms 防抖延迟
}

/**
 * 获取当前余额（同步）
 * @returns {number} 当前余额
 */
export function getBalance() {
  return balanceState.balance
}

/**
 * 设置余额（内部使用）
 * @param {number} balance 余额值
 */
function setBalance(balance) {
  balanceState.balance = parseFloat(balance || 0)
  balanceState.lastUpdateTime = Date.now()
  notifyListeners()
}

/**
 * 刷新余额（带请求去重）
 * @param {boolean} force 是否强制刷新（忽略缓存）
 * @returns {Promise<number>} 返回余额值
 */
export async function refreshBalance(force = false) {
  // 检查是否有 token
  const token = uni.getStorageSync('token')
  if (!token) {
    console.log('未登录，跳过刷新余额')
    setBalance(0)
    return 0
  }

  // 如果已有正在进行的请求，直接返回该 Promise（请求去重）
  if (balanceState.pendingPromise && !force) {
    console.log('余额请求已在进行中，复用现有请求')
    return balanceState.pendingPromise
  }

  // 创建新的请求 Promise
  balanceState.isLoading = true
  balanceState.pendingPromise = (async () => {
    try {
      const res = await getUserBalance()
      
      if (res.statusCode === 200 && res.data.code === 0) {
        const balance = parseFloat(res.data.data.balance || 0)
        setBalance(balance)
        console.log('余额刷新成功:', balance)
        return balance
      } else if (res.statusCode === 401 || 
                 (res.data && res.data.code === -1 && res.data.message && res.data.message.includes('token'))) {
        // token 无效或已过期
        console.warn('token 无效或已过期，清除余额')
        setBalance(0)
        // 清除登录信息
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')
        return 0
      } else {
        console.warn('获取余额失败:', res.data?.message || '未知错误')
        return balanceState.balance // 返回旧值
      }
    } catch (err) {
      console.warn('获取用户余额失败:', err)
      // 如果是 401 错误，清除登录信息
      if (err.statusCode === 401 || (err.data && err.data.message && err.data.message.includes('token'))) {
        setBalance(0)
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')
      }
      return balanceState.balance // 返回旧值
    } finally {
      balanceState.isLoading = false
      balanceState.pendingPromise = null
    }
  })()

  return balanceState.pendingPromise
}

/**
 * 初始化余额（每次从后端实时获取）
 * @returns {Promise<number>} 返回余额值
 */
export async function initBalance() {
  // 每次从后端实时获取，不使用缓存
  return await refreshBalance()
}

/**
 * 清除余额（用于登出等场景）
 */
export function clearBalance() {
  setBalance(0)
  balanceState.lastUpdateTime = 0
}

/**
 * 获取加载状态
 * @returns {boolean} 是否正在加载
 */
export function isLoading() {
  return balanceState.isLoading
}

