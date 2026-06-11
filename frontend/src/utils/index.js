export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function highlightKeyword(text, keyword) {
  if (!keyword || !text) return text
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

export function getTodayString() {
  return new Date().toISOString().split('T')[0]
}

export function getDaysUntil(dueDate) {
  if (!dueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffTime = due - today
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getUrgencyStatus(dueDate, completed) {
  if (completed) return 'completed'
  if (!dueDate) return 'normal'
  
  const daysLeft = getDaysUntil(dueDate)
  if (daysLeft < 0) return 'overdue'
  if (daysLeft <= 3) return 'urgent'
  return 'normal'
}

export function getUrgencyText(status, daysLeft) {
  switch (status) {
    case 'overdue':
      return `已过期 ${Math.abs(daysLeft)} 天`
    case 'urgent':
      return `还剩 ${daysLeft} 天`
    case 'completed':
      return '已完成'
    default:
      return daysLeft !== null ? `还剩 ${daysLeft} 天` : '无截止日期'
  }
}
