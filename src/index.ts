import { config } from '~/config'
import { logger } from '~/utils'

logger.info`v${config.VERSION}`
