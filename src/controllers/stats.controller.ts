import type { FastifyReply, FastifyRequest } from 'fastify';
import type { StatsService } from '../services/stats.service.js';
import type { StatsParamsRequest } from '../types/http/stats.http.types.js';

export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  listAll = async (_request: FastifyRequest, reply: FastifyReply) => {
    const urls = await this.statsService.listUrlsWithStats();
    return reply.send(urls);
  };

  getStats = async (
    request: FastifyRequest<StatsParamsRequest>,
    reply: FastifyReply,
  ) => {
    const stats = await this.statsService.getStats(request.params.code);
    return reply.send(stats);
  };
}
