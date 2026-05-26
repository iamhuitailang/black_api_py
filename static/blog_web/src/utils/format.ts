import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

export const formatDate = (value?: string | number | Date, format = 'YYYY-MM-DD HH:mm') => {
  if (!value) return ''
  return dayjs(value).format(format)
}

export const formatFromNow = (value?: string | number | Date) => {
  if (!value) return ''
  return dayjs(value).fromNow()
}

export const slugify = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const excerpt = (text: string, len = 140): string => {
  if (!text) return ''
  const clean = text.replace(/[#*`>!\[\]()\-]/g, '').replace(/\s+/g, ' ')
  return clean.length > len ? clean.slice(0, len) + '…' : clean
}
