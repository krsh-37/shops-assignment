import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';

export const mastra = new Mastra({
  logger: new PinoLogger({
    name: 'ShopClaw',
    level: process.env.MASTRA_LOG_LEVEL || 'info',
  }),
});
