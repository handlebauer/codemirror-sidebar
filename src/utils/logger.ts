import { configure, getLogger, getConsoleSink } from '@logtape/logtape'
import { config } from '~/config'

await configure({
    sinks: { console: getConsoleSink() },
    filters: {},
    loggers: [
        { category: ['logtape', 'meta'], level: 'warning', sinks: ['console'] },
        { category: [config.PACKAGE_NAME], level: 'debug', sinks: ['console'] },
    ],
})

export const logger = getLogger([config.PACKAGE_NAME])
