import { $fetch, fetch as testFetch, url } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { setupNuxtIntegration } from '../setup/nuxt'
import { getDb } from '../../server/utils/db'
import { createSession, encodeSessionCookieValue } from '../../server/utils/session'
import { hashSmsCode } from '../../server/utils/mock-sms'

await setupNuxtIntegration()

describe('beta auth', () => {
  async function fetchRaw(path: string, init?: RequestInit) {
    return testFetch(url(path), init)
  }

  async function ensureAdminSession(phone = '15500009999') {
    const { sqlite } = getDb()
    const now = new Date().toISOString()

    const existing = sqlite
      .prepare(`SELECT id FROM users WHERE phone = ? LIMIT 1`)
      .get(phone) as { id: number } | undefined

    const adminId =
      existing?.id ??
      Number(
        sqlite
          .prepare(
            `
            INSERT INTO users(phone, display_name, role, created_at)
            VALUES (?, NULL, 'admin', ?)
          `,
          )
          .run(phone, now).lastInsertRowid,
      )

    sqlite.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(adminId)

    const session = await createSession(adminId)
    const cookie = `xgt_session_token=${encodeSessionCookieValue(session.sessionToken)}`
    return { adminId, cookie }
  }

  function allowlistPhone(phone: string, createdBy: number | null) {
    const { sqlite } = getDb()
    sqlite
      .prepare(
        `
        INSERT INTO beta_access_phones(phone, enabled, created_at, created_by)
        VALUES (?, 1, ?, ?)
        ON CONFLICT(phone) DO UPDATE SET enabled = 1
      `,
      )
      .run(phone, new Date().toISOString(), createdBy)
  }

  it('rejects request-code for a non-allowlisted phone in non-development mode', async () => {
    await expect(
      $fetch('/api/auth/request-code', {
        method: 'POST',
        body: { phone: '15500001234' },
      }),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('rejects request-code for an admin phone that is not allowlisted in non-development mode', async () => {
    const adminPhone = '15500007777'
    await ensureAdminSession(adminPhone)
    await expect(
      $fetch('/api/auth/request-code', {
        method: 'POST',
        body: { phone: adminPhone },
      }),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('rejects verify-code for an admin phone that is not allowlisted in non-development mode', async () => {
    const adminPhone = '15500007778'
    await ensureAdminSession(adminPhone)

    // Pre-seed a code row so we can attempt verification without using request-code.
    const { sqlite } = getDb()
    const now = new Date()
    const createdAt = now.toISOString()
    const expiresAt = new Date(now.getTime() + 10 * 60_000).toISOString()
    const codePlain = '123456'
    sqlite
      .prepare(
        `
        INSERT INTO login_codes(phone, code_hash, expires_at, used_at, request_ip)
        VALUES (?, ?, ?, NULL, NULL)
      `,
      )
      .run(adminPhone, hashSmsCode(codePlain), expiresAt)

    await expect(
      $fetch('/api/auth/verify-code', {
        method: 'POST',
        body: { phone: adminPhone, code: codePlain },
      }),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('requires admin session to read debug codes', async () => {
    const res = await fetchRaw('/api/admin/beta-access')
    expect([401, 403]).toContain(res.status)
  })

  it('blocks /admin/beta-access for a logged-in non-admin user', async () => {
    const { sqlite } = getDb()
    const now = new Date().toISOString()
    const phone = '15500008888'
    const userId = Number(
      sqlite
        .prepare(
          `
          INSERT INTO users(phone, display_name, role, created_at)
          VALUES (?, NULL, 'user', ?)
        `,
        )
        .run(phone, now).lastInsertRowid,
    )

    const session = await createSession(userId)
    const cookie = `xgt_session_token=${encodeSessionCookieValue(session.sessionToken)}`

    const res = await fetchRaw('/admin/beta-access', {
      headers: { cookie },
    } as RequestInit)
    expect([401, 403]).toContain(res.status)
  })

  it('issues a code, exposes it only via admin tooling, and creates a session on verify', async () => {
    const { adminId, cookie: adminCookie } = await ensureAdminSession()

    const phone = '15500009002'
    allowlistPhone(phone, adminId)

    const requestRes = await $fetch('/api/auth/request-code', {
      method: 'POST',
      body: { phone },
    })
    expect((requestRes as any).ok).toBe(true)
    expect((requestRes as any).code).toBeUndefined()
    expect((requestRes as any).debugCode).toBeUndefined()

    const adminView = await $fetch('/api/admin/beta-access', {
      headers: { cookie: adminCookie },
    })
    const debug = (adminView as any).debugCodes.find((d: any) => d.phone === phone)
    expect(debug).toBeTruthy()
    expect(debug.codePlain).toMatch(/^[0-9]{6}$/)

    const verifyRaw = await fetchRaw('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, code: debug.codePlain }),
    })
    expect(verifyRaw.status).toBe(200)
    const setCookie = verifyRaw.headers.get('set-cookie')
    expect(setCookie).toContain('xgt_session_token=')
    expect(setCookie).toContain('HttpOnly')

    const sessionCookie = setCookie!.split(';')[0]!

    const me = await $fetch('/api/me', { headers: { cookie: sessionCookie } })
    expect((me as any).user).toBeTruthy()
    expect((me as any).user.phone).toBe(phone)

    const logout = await $fetch('/api/auth/logout', {
      method: 'POST',
      headers: { cookie: sessionCookie },
    })
    expect((logout as any).ok).toBe(true)

    const meAfter = await $fetch('/api/me', { headers: { cookie: sessionCookie } })
    expect((meAfter as any).user).toBeNull()
  })

  it('rate limits request-code per phone', async () => {
    const { adminId } = await ensureAdminSession('15500009998')
    const phone = '15500009003'
    allowlistPhone(phone, adminId)

    for (let i = 0; i < 5; i += 1) {
      const res = await $fetch('/api/auth/request-code', { method: 'POST', body: { phone } })
      expect((res as any).ok).toBe(true)
    }

    await expect(
      $fetch('/api/auth/request-code', { method: 'POST', body: { phone } }),
    ).rejects.toMatchObject({ statusCode: 429 })
  })

  it('locks out after repeated failed verification attempts', async () => {
    const { adminId, cookie: adminCookie } = await ensureAdminSession('15500009997')
    const phone = '15500009004'
    allowlistPhone(phone, adminId)

    await $fetch('/api/auth/request-code', { method: 'POST', body: { phone } })

    const adminView = await $fetch('/api/admin/beta-access', {
      headers: { cookie: adminCookie },
    })
    const debug = (adminView as any).debugCodes.find((d: any) => d.phone === phone)
    expect(debug).toBeTruthy()

    for (let i = 0; i < 4; i += 1) {
      await expect(
        $fetch('/api/auth/verify-code', { method: 'POST', body: { phone, code: '000000' } }),
      ).rejects.toMatchObject({ statusCode: 400 })
    }

    // 5th failure triggers lockout
    await expect(
      $fetch('/api/auth/verify-code', { method: 'POST', body: { phone, code: '000000' } }),
    ).rejects.toMatchObject({ statusCode: 429 })

    // Locked out even with a correct code
    await expect(
      $fetch('/api/auth/verify-code', { method: 'POST', body: { phone, code: debug.codePlain } }),
    ).rejects.toMatchObject({ statusCode: 429 })
  })
})
