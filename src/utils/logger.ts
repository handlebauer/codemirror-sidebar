import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

const logger = pino({
    level: 'debug',
    transport: !isProduction
        ? {
              target: 'pino-pretty', // loads pino-pretty for pretty printing in development
              options: {
                  colorize: true,
                  translateTime: 'SYS:standard', // optional: format the timestamp
              },
          }
        : undefined,
})

export default logger
