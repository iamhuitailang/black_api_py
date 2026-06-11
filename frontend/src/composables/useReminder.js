import { ref } from 'vue'
import { actionItemApi } from '../api'

const notificationEnabled = ref(false)
const lastCheckTime = ref(0)
const notifiedIds = ref(new Set())
let checkTimer = null

export function useReminder() {
  const hasNotificationSupport = typeof Notification !== 'undefined'

  async function requestPermission() {
    if (!hasNotificationSupport) {
      console.warn('浏览器不支持桌面通知')
      return false
    }
    if (Notification.permission === 'granted') {
      notificationEnabled.value = true
      return true
    }
    if (Notification.permission === 'denied') {
      console.warn('通知权限已被拒绝，请到浏览器设置中开启')
      return false
    }
    const permission = await Notification.requestPermission()
    notificationEnabled.value = permission === 'granted'
    return notificationEnabled.value
  }

  function showNotification(title, options = {}) {
    if (!notificationEnabled.value) return null
    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      })
      notification.onclick = () => {
        window.focus()
        if (options.url) {
          window.location.href = options.url
        }
        notification.close()
      }
      return notification
    } catch (e) {
      console.warn('显示通知失败:', e)
      return null
    }
  }

  async function checkReminders() {
    if (!notificationEnabled.value) return

    try {
      const items = await actionItemApi.getList({ completed: false })
      const now = new Date()

      items.forEach(item => {
        if (!item.reminder_time || item.reminder_sent) return
        if (notifiedIds.value.has(item.id)) return

        try {
          const reminderTime = new Date(item.reminder_time.replace(' ', 'T'))
          if (reminderTime <= now) {
            const diff = now - reminderTime
            if (diff < 2 * 60 * 1000) {
              showNotification('⏰ 待办事项提醒', {
                body: `${item.content}\n责任人：${item.assignee || '未设置'}\n所属会议：${item.meeting_title || ''}`,
                tag: `action-${item.id}`,
                url: `/#/meetings/${item.meeting_id}`,
                requireInteraction: true
              })
              notifiedIds.value.add(item.id)
            }
          }
        } catch (e) {
          console.warn('解析提醒时间失败:', e)
        }
      })

      lastCheckTime.value = Date.now()
    } catch (e) {
      console.warn('检查提醒失败:', e)
    }
  }

  function startChecking(interval = 30000) {
    stopChecking()
    if (notificationEnabled.value) {
      checkReminders()
      checkTimer = setInterval(checkReminders, interval)
    }
  }

  function stopChecking() {
    if (checkTimer) {
      clearInterval(checkTimer)
      checkTimer = null
    }
  }

  function clearNotified(id = null) {
    if (id) {
      notifiedIds.value.delete(id)
    } else {
      notifiedIds.value.clear()
    }
  }

  return {
    hasNotificationSupport,
    notificationEnabled,
    lastCheckTime,
    requestPermission,
    showNotification,
    checkReminders,
    startChecking,
    stopChecking,
    clearNotified
  }
}
