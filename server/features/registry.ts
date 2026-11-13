import { Router } from 'express'
import { limparDmRoutes } from './limpar-dm'
import { backupToolRoutes } from './backup'
import { limparPackageRoutes } from './limpar-package'
import { packageAnalyticsRoutes } from './package-analytics'
import { abrirDmsRoutes } from './abrir-dms'
import { limparDmsAbertasRoutes } from './limpar-dms-abertas'
import { limparDmAmigosRoutes } from './limpar-dm-amigos'
import { removerAmigosRoutes } from './remover-amigos'
import { removerServidoresRoutes } from './remover-servidores'
import { clonarServidorRoutes } from './clonar-servidor'
import { scraperIconsRoutes } from './scraper-icons'
import { fecharDmsRoutes } from './fechar-dms'
import { callUtilsRoutes } from './call-utils'
import { prefixCommandsRoutes } from './prefix-commands'
import { monitoringRoutes } from './monitoring'
import { keywordAlertsRoutes } from './keyword-alerts'
import { accountToolsRoutes } from './account-tools'
import { statusRotatorRoutes } from './status-rotator'
import { autoResponderRoutes } from './auto-responder'
import { webhooksRoutes } from './webhooks'
import { usernameSniperRoutes } from './username-sniper'
import { questFarmerRoutes } from './quest-farmer'
import { badgeCollectorRoutes } from './badge-collector'
import { autobumpRoutes } from './autobump'
import { schedulerRoutes } from './scheduler'
import { messageSniperRoutes } from './message-sniper'
import { giveawayJoinerRoutes } from './giveaway-joiner'

const featureRouter = Router()

featureRouter.use('/', limparDmRoutes)
featureRouter.use('/', backupToolRoutes)
featureRouter.use('/', limparPackageRoutes)
featureRouter.use('/', packageAnalyticsRoutes)
featureRouter.use('/', abrirDmsRoutes)
featureRouter.use('/', limparDmsAbertasRoutes)
featureRouter.use('/', limparDmAmigosRoutes)
featureRouter.use('/', removerAmigosRoutes)
featureRouter.use('/', removerServidoresRoutes)
featureRouter.use('/', clonarServidorRoutes)
featureRouter.use('/', scraperIconsRoutes)
featureRouter.use('/', fecharDmsRoutes)
featureRouter.use('/', callUtilsRoutes)
featureRouter.use('/', prefixCommandsRoutes)
featureRouter.use('/', monitoringRoutes)
featureRouter.use('/', keywordAlertsRoutes)
featureRouter.use('/', accountToolsRoutes)
featureRouter.use('/', statusRotatorRoutes)
featureRouter.use('/', autoResponderRoutes)
featureRouter.use('/', webhooksRoutes)
featureRouter.use('/', usernameSniperRoutes)
featureRouter.use('/', questFarmerRoutes)
featureRouter.use('/', badgeCollectorRoutes)
featureRouter.use('/', autobumpRoutes)
featureRouter.use('/', schedulerRoutes)
featureRouter.use('/', messageSniperRoutes)
featureRouter.use('/', giveawayJoinerRoutes)

export default featureRouter
