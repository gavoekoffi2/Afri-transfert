import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { GeniusPayWebhookPayload } from './webhook.types';
import { WebhooksService } from './webhooks.service';

/**
 * Endpoint de réception des webhooks GeniusPay.
 * Chemin exact : `POST /api/webhooks/geniuspay` (non versionné).
 */
@ApiTags('webhooks')
@Controller({ path: 'webhooks', version: VERSION_NEUTRAL })
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Public()
  @Post('geniuspay')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint() // appelé par GeniusPay, pas par les clients de l'API
  async geniuspay(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-webhook-signature') signature: string,
    @Headers('x-webhook-timestamp') timestamp: string,
    @Headers('x-webhook-event') event: string,
    @Headers('x-webhook-delivery') delivery: string,
    @Headers('x-webhook-environment') environment: string,
    @Body() body: GeniusPayWebhookPayload,
  ) {
    return this.webhooks.handleIncoming(req.rawBody, { signature, timestamp, event, delivery, environment }, body);
  }
}
