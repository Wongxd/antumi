import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ProjectRegistry } from './project-registry'
import { TaskStore } from './task-store'

describe('ProjectRegistry', () => {
  let dir: string
  let tasks: TaskStore
  let projects: ProjectRegistry

  beforeEach(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), 'antumi-projects-'))
    const file = path.join(dir, 'antumi.db')
    // Creates the table the registry reads.
    tasks = new TaskStore(file)
    let now = 1
    projects = new ProjectRegistry(file, () => now++)
  })

  afterEach(() => {
    projects.close()
    tasks.close()
    rmSync(dir, { recursive: true, force: true })
  })

  it('lists projects most recent first, a repeat moving to the front', () => {
    projects.remember(['/a', '/b'])
    projects.remember(['/a'])
    expect(projects.recent()).toEqual([path.normalize('/a'), path.normalize('/b')])
  })

  it('lists every known project, where the recent list stops at its cap', () => {
    for (let index = 0; index < 60; index++) projects.remember([`/code/p${index}`])
    expect(projects.all()).toHaveLength(60)
    expect(projects.recent()).toHaveLength(50)
    expect(projects.all().slice(0, 50)).toEqual(projects.recent())
    expect(projects.all()[0]).toEqual(path.normalize('/code/p59'))
  })

  it('stores and forgets paths in their normal form', () => {
    projects.remember(['/code/tmp/../app'])
    projects.remember(['/code/./lib'])
    expect(projects.recent()).toEqual(['/code/lib', '/code/app'].map((file) => path.normalize(file)))
    projects.forget('/code/lib/../app')
    expect(projects.recent()).toEqual([path.normalize('/code/lib')])
  })
})
