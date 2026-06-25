import { Injectable, Logger } from '@nestjs/common';
import { AuditActorType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface AuditParams {
  actorType: AuditActorType;
  actorId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Journalisation d'audit transverse (qui a fait quoi, quand, d'où).
 * Les échecs d'écriture d'audit ne doivent jamais interrompre le flux métier.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorType: params.actorType,
          actorId: params.actorId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          metadata: params.metadata,
        },
      });
    } catch (error) {
      this.logger.warn(`Échec d'écriture du journal d'audit: ${(error as Error).message}`);
    }
  }
}
