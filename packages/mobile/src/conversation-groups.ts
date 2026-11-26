// How the conversation list under its status sections is arranged: one list of what moved lately,
// or one list per project. Project groups go by name, with what has no project last, and each
// group says how many conversations it holds. Project groups start folded and open one by one;
// the fold lives in the session while the app runs.
import { locale } from './i18n'
import { folderName } from './labels'

export const CONVERSATION_GROUPINGS = ['recent', 'project'] as const
export type ConversationGrouping = (typeof CONVERSATION_GROUPINGS)[number]

// `label` is null for the recent list itself, whose title the screen brings. A folded group keeps
// its `total` but brings no `items`, so its heading still says what it holds.
export type ConversationGroup<T> = { key: string; label: string | null; items: T[]; total: number }

const collator = new Intl.Collator(locale === 'zh' ? 'zh-CN' : 'en')

// The key a group's fold is remembered under.
export const projectGroupKey = (project: string | null): string => `project:${project ?? ''}`

// `recent` comes sorted by what moved lately, and the groups keep that order inside. The list
// shows only the first `budget` rows altogether — what is folded takes none — and scrolling to
// the bottom raises it.
export function arrangeRecent<T extends { projectPaths: readonly string[] }>(recent: readonly T[], by: ConversationGrouping, budget: number, noProject: string, open: Readonly<Record<string, true>> = {}): { groups: Array<ConversationGroup<T>>; more: boolean } {
  if (by === 'recent') {
    const items = recent.slice(0, budget)
    return { groups: items.length > 0 ? [{ key: 'recent', label: null, items, total: recent.length }] : [], more: recent.length > budget }
  }
  const found = new Map<string, { project: string | null; label: string; items: T[] }>()
  for (const conversation of recent) {
    // A conversation belongs to its primary project, where its agent works.
    const project = conversation.projectPaths[0] ?? null
    const group = found.get(project ?? '') ?? { project, label: project ? folderName(project) : noProject, items: [] }
    group.items.push(conversation)
    found.set(project ?? '', group)
  }
  const ordered = [...found.values()].sort((a, b) =>
    (a.project === null ? 1 : 0) - (b.project === null ? 1 : 0) || collator.compare(a.label, b.label))
  let left = budget
  let wanted = 0
  const groups = ordered.map(({ project, label, items }): ConversationGroup<T> => {
    const key = projectGroupKey(project)
    if (open[key] !== true) return { key, label, items: [], total: items.length }
    wanted += items.length
    const shown = items.slice(0, Math.max(left, 0))
    left -= shown.length
    return { key, label, items: shown, total: items.length }
  })
  return { groups, more: wanted > budget }
}
