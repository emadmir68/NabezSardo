import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['query'],
    })
  }
  return globalForPrisma.prisma
}

/* نمای تنبل: کلاینت Prisma فقط هنگام اولین کوئری ساخته می‌شود؛
   روی Cloudflare Workers (حالت d1) هرگز ساخته نمی‌شود و مشکل SQLite-engine پیش نمی‌آید. */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getPrisma() as unknown as Record<string | symbol, unknown>
    const value = client[prop]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value
  },
})
