import { z } from 'zod'
import { todoTools } from '../modules/todo/tools'
import { crmTools } from '../modules/crm/tools'
import { financeTools } from '../modules/finance/tools'
import { tweedTools } from '../modules/tweed/tools'
import { lucieTools } from '../modules/lucie/tools'
import { shoppingTools } from '../modules/shopping/tools'
import { healthTools } from '../modules/health/tools'
import { fitnessTools } from '../modules/fitness/tools'
import { visionTools } from '../modules/vision/tools'
import { aestheticsTools } from '../modules/aesthetics/tools'
import { homeTools } from '../modules/home/tools'
import { professionalTools } from '../modules/professional/tools'
import { eventsTools } from '../modules/events/tools'
import { spiritualityTools } from '../modules/spirituality/tools'
import { learningTools } from '../modules/learning/tools'
import { travelTools } from '../modules/travel/tools'
import { socialTools } from '../modules/social/tools'
import { mentalHealthTools } from '../modules/mental-health/tools'
import { creativityTools } from '../modules/creativity/tools'
import { serviceProviderTools } from '../modules/service-providers/tools'
import { fitnessEventsTools } from '../modules/fitness-events/tools'

export interface McpTool {
  name: string
  description: string
  inputSchema: z.ZodSchema
  handler: (input: unknown) => Promise<unknown>
}

export const mcpTools: McpTool[] = [
  ...todoTools,
  ...crmTools,
  ...financeTools,
  ...tweedTools,
  ...lucieTools,
  ...shoppingTools,
  ...healthTools,
  ...fitnessTools,
  ...visionTools,
  ...aestheticsTools,
  ...homeTools,
  ...professionalTools,
  ...eventsTools,
  ...spiritualityTools,
  ...learningTools,
  ...travelTools,
  ...socialTools,
  ...mentalHealthTools,
  ...creativityTools,
  ...serviceProviderTools,
  ...fitnessEventsTools,
]
