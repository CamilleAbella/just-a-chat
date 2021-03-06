import express from "express"
import argon from "argon2"
import fs from "fs/promises"
import path from "path"
import Markdown from "markdown-it"
import hljs from "highlightjs"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import * as entities from "./entities"

const uuid = require("uuid")

dayjs.extend(relativeTime)

export { dayjs }

export const md: Markdown = new Markdown({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        // remove multiline comments
        // const regex = /\/\*(?:[\s\S]*?)\*\//g
        // let match
        // while ((match = regex.exec(str)) !== null) {
        //   const comment = match[0]
        //   if (comment && comment.includes("\n")) {
        //     str = str.replace(comment, "/* aborted comment */")
        //   }
        // }

        // parse code
        const code = hljs.highlight(lang, str, true).value

        // place line numbers
        const withLineNumbers = addLineNumbersTo(code)

        // return result
        return `<pre class="hljs"><code>${withLineNumbers}</code></pre>`
      } catch (_) {}
    }
    return (
      '<pre class="hljs"><code>' +
      addLineNumbersTo(md.utils.escapeHtml(str)) +
      "</code></pre>"
    )
  },
})

export function parseAdministrators() {
  return process.env.ADMINISTRATORS?.split(",") ?? []
}

export function addLineNumbersTo(code: string): string {
  const lines = code.trim().split("\n")
  if (lines.length < 5) return code
  return lines
    .map((line, index) => {
      //`<span class="hljs-line"><span class="hljs-line-number">${index}</span><span class="hljs-line-code">${line}</span></span>`
      return `<span class="hljs-line-number">${index}</span>${line}`
    })
    .join("\n")
}

export function sortByDate(a: entities.Post, b: entities.Post): number {
  const a_recent = Math.max(
    a.date,
    ...a.getAllChildren().map((child) => child.date)
  )
  const b_recent = Math.max(
    b.date,
    ...b.getAllChildren().map((child) => child.date)
  )
  return b_recent - a_recent
}

export function removeDuplicate<T>(array: T[]): T[] {
  return [...new Set(array)]
}

export async function forEachFileInDirectories(
  pathList: string[],
  callback: (filePath: string) => Promise<any>
) {
  for (const _path of pathList) {
    const dir = await fs.readdir(_path)
    for (const filename of dir) {
      const filePath = path.join(_path, filename)
      if ((await fs.stat(filePath)).isDirectory()) {
        await forEachFileInDirectories([filePath], callback)
      } else {
        await callback(filePath)
      }
    }
  }
}

export function error(res: express.Response, message: string) {
  res.render("pages/error", { message })
}

export function page(
  req: express.Request,
  res: express.Response,
  page: string,
  options: {} = {}
) {
  if (isSessionActive(req)) {
    req.session.lastPage = req.path
  }

  options = {
    redirect: "",
    ...req.query,
    ...req.params,
    ...options,
  }

  res.render("pages/" + page, options)
}

export function back(req: express.Request, res: express.Response) {
  res.redirect(req.session?.lastPage ?? "/")
}

export function makeId(): string {
  return uuid.v4()
}

export type Request = express.Request & { session: Express.Session }

export function isSessionActive(req: express.Request): req is Request {
  return !!req.session?.logged
}

export function logUser(req: express.Request, user: entities.User | string) {
  const user_id = typeof user === "string" ? user : user.id
  if (req.session) {
    req.session.logged = true
    req.session.user_id = user_id
  } else {
    console.error("Failed to log user: " + user_id)
  }
}

export function logout(req: Request, res: express.Response) {
  sessions.delete(req.session.user_id)
  req.session?.destroy?.(() => {
    res.redirect("/")
  })
}

export function loggedUserId(req: Request): string
export function loggedUserId(req: express.Request): undefined
export function loggedUserId(
  req: express.Request | Request
): string | undefined {
  return req.session?.user_id
}

export async function hash(
  res: express.Response,
  password: string
): Promise<string | null> {
  if (password.trim().length < 5) {
    error(res, "The password must be contains minimum 5 chars.")
    return null
  }
  return argon.hash(password, {
    salt: Buffer.from(process.env.HASH_SALT as string),
  })
}

export function validateUsername(
  res: express.Response,
  username: string,
  callback: () => unknown
): void {
  if (/\s/.test(username)) {
    return error(res, "Username mustn't contains spaces.")
  }

  if (username.length > 20) {
    return error(res, "Username is too large (20 char max)")
  }

  callback()
}

export async function parseLogin(
  req: express.Request,
  res: express.Response
): Promise<{
  username: string
  hash: string
} | null> {
  const username: string = req.body.username?.trim()
  const password: string = req.body.password

  if (!username || !password) return null

  const _hash = await hash(res, password)

  if (!_hash) return null

  return {
    username,
    hash: _hash,
  }
}

/** Contains sessions activity timeouts <user_id, last_activity_time> */
export const sessions = new Map<string, number>()
export const sessionTimeout = 1000 * 60 * 3 // 3 min

export function refreshSessions() {
  const now = Date.now()
  sessions.forEach((time, id) => {
    if (now > time + sessionTimeout) {
      sessions.delete(id)
    }
  })
}

export function checkoutSession(
  req: express.Request,
  res: express.Response,
  callback: (user: entities.User, session: Request) => any
) {
  if (isSessionActive(req)) {
    const user = entities.User.fromId(loggedUserId(req))
    if (user) {
      sessions.set(user.id, Date.now())
      callback(user, req)
    } else {
      error(res, "Internal error!")
    }
  } else {
    res.redirect(`/login?redirect=${req.path}`)
  }
}

export function turnAround(
  req: express.Request,
  res: express.Response,
  defaultRoute: string
) {
  res.redirect(
    typeof req.query.redirect === "string" && req.query.redirect.length > 2
      ? req.query.redirect
      : defaultRoute
  )
}

export interface Pagination<T> {
  items: T[]
  pages: T[][]
  page: T[]
  index: number
  next: boolean
  prev: boolean
  lastIndex: number
  active: boolean
}

export const maxItemPerPage: number = 6

export function paginate<T>(items: T[], pageIndex: number = 0): Pagination<T> {
  const pages: T[][] = []
  const pageCount = Math.ceil(items.length / maxItemPerPage)
  for (let i = 0; i < pageCount; i++) {
    pages.push(items.slice(maxItemPerPage * i, maxItemPerPage * (i + 1)))
  }
  return {
    items,
    pages,
    page: pages[pageIndex] ?? [],
    index: pageIndex,
    next: pageIndex < pageCount - 1,
    prev: pageIndex > 0,
    lastIndex: pageCount - 1,
    active: pages.length > 1,
  }
}
