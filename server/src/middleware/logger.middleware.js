export const logger = (req, res, next) => {
  const time = new Date().toISOString()

  console.log(
    `${time} | ${req.method} | ${req.originalUrl} | ${req.ip}`
  )

  next()
}