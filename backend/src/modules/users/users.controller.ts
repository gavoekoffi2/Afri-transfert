import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Profil de l\'utilisateur connecté' })
  async me(@CurrentUser('sub') userId: string) {
    const user = await this.users.findByIdOrFail(userId);
    return UsersService.toPublic(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Mettre à jour son profil' })
  async updateMe(@CurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    const updated = await this.users.update(userId, dto);
    return UsersService.toPublic(updated);
  }
}
