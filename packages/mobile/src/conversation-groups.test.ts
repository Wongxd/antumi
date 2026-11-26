import { describe, expect, it } from 'vitest'
import { arrangeRecent } from './conversation-groups'

const chat = (id: string, project: string | null) => ({ id, projectPaths: project ? [project] : [] })

describe('arrangeRecent', () => {
  it('keeps one recent list, in the order it came', () => {
    const { groups, more } = arrangeRecent([chat('a', '/x/shop'), chat('b', null)], 'recent', 50, 'No project')
    expect(groups.map((group) => [group.label, group.total, group.items.map((item) => item.id)])).toEqual([[null, 2, ['a', 'b']]])
    expect(more).toBe(false)
  })

  it('groups by project name, alphabetically, with what has no project last', () => {
    const { groups } = arrangeRecent(
      [chat('a', '/x/shop'), chat('b', '/x/blog'), chat('c', null), chat('d', '/x/shop')],
      'project', 50, 'Aaa')
    expect(groups.map((group) => [group.label, group.total])).toEqual([['blog', 1], ['shop', 2], ['Aaa', 1]])
  })

  it('folds every project group until it is opened, heading and count stay', () => {
    const { groups, more } = arrangeRecent(
      [chat('a', '/x/blog'), chat('b', '/x/shop'), chat('c', '/x/shop')],
      'project', 50, 'No project')
    expect(groups.map((group) => [group.key, group.items.length, group.total])).toEqual([['project:/x/blog', 0, 1], ['project:/x/shop', 0, 2]])
    expect(more).toBe(false)
  })

  it('shows an opened group its rows, and spends the budget on opened rows only', () => {
    const { groups, more } = arrangeRecent(
      [chat('a', '/x/blog'), chat('b', '/x/shop'), chat('c', '/x/shop')],
      'project', 2, 'No project', { 'project:/x/blog': true, 'project:/x/shop': true })
    expect(groups.map((group) => [group.label, group.items.map((item) => item.id), group.total])).toEqual([['blog', ['a'], 1], ['shop', ['b'], 2]])
    expect(more).toBe(true)
  })

  it('keeps a folded group out of the budget and out of the more', () => {
    const { groups, more } = arrangeRecent(
      [chat('a', '/x/blog'), chat('b', '/x/shop'), chat('c', '/x/shop')],
      'project', 2, 'No project', { 'project:/x/shop': true })
    expect(groups.map((group) => [group.label, group.items.map((item) => item.id)])).toEqual([['blog', []], ['shop', ['b', 'c']]])
    expect(more).toBe(false)
  })

  it('lists every project heading, however small the budget', () => {
    const { groups, more } = arrangeRecent(
      [chat('a', '/x/one'), chat('b', '/x/two'), chat('c', '/x/three')],
      'project', 0, 'No project')
    expect(groups.map((group) => group.label)).toEqual(['one', 'three', 'two'])
    expect(more).toBe(false)
  })

  it('shows nothing and no more when the list is empty', () => {
    expect(arrangeRecent([], 'project', 50, 'No project')).toEqual({ groups: [], more: false })
    expect(arrangeRecent([], 'recent', 50, 'No project')).toEqual({ groups: [], more: false })
  })
})
