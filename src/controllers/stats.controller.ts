import type { FastifyReply, FastifyRequest } from 'fastify';
import type { StatsService } from '../services/stats.service.js';

interface CodeParams {
  code: string;
}

export function createStatsController(statsService: StatsService) {
  return {
    async getStats(
      request: FastifyRequest<{ Params: CodeParams }>,
      reply: FastifyReply,
    ) {
      const stats = await statsService.getStats(request.params.code);
      return reply.send(stats);
    },
  };
}
