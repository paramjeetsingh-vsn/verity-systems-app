const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

export function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 0) return date.toLocaleDateString()

    if (diff < MINUTE) return "Just now"
    if (diff < HOUR) {
        const mins = Math.floor(diff / MINUTE)
        return `${mins}m ago`
    }
    if (diff < DAY) {
        const hours = Math.floor(diff / HOUR)
        return `${hours}h ago`
    }
    if (diff < 2 * DAY) return "Yesterday"
    if (diff < WEEK) {
        const days = Math.floor(diff / DAY)
        return `${days}d ago`
    }

    const sameYear = date.getFullYear() === now.getFullYear()
    if (sameYear) {
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    }

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}
