import type { Request, Response, NextFunction } from 'express'

/**
 * Validates that POST/PUT/PATCH requests include a valid Content-Type header.
 * Prevents unexpected payloads from being processed.
 */
export function validateContentType(req: Request, res: Response, next: NextFunction) {
  const methodsRequiringBody = ['POST', 'PUT', 'PATCH']
  if (methodsRequiringBody.includes(req.method)) {
    const contentLength = parseInt(req.headers['content-length'] ?? '0', 10)
    const hasBody = contentLength > 0 || req.headers['transfer-encoding'] === 'chunked'
    if (hasBody) {
      const contentType = req.headers['content-type'] || ''
      const isValid =
        contentType.includes('application/json') ||
        contentType.includes('multipart/form-data') ||
        contentType.includes('application/x-www-form-urlencoded')
      if (!isValid) {
        res.status(415).json({ error: 'Unsupported Media Type. Use application/json.' })
        return
      }
    }
  }
  next()
}

/**
 * Strips keys starting with '$' or containing '.' from req.body
 * to prevent basic NoSQL injection patterns.
 */
export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body)
  }
  next()
}

function deepSanitize(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize)
  }
  if (obj !== null && typeof obj === 'object') {
    const clean: Record<string, any> = {}
    for (const key of Object.keys(obj)) {
      // Remove dangerous keys
      if (key.startsWith('$') || key.includes('.')) continue
      clean[key] = deepSanitize(obj[key])
    }
    return clean
  }
  return obj
}
