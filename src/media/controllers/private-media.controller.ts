import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GetUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUser } from 'src/auth/types/current-user.type';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PRIVATE_API_PREFIX } from 'src/common/constants/routes.constant';

import { UpdateMediaDto } from '../dto/update-media.dto';
import { MediaService } from '../media.service';

@ApiTags('Media (Dashboard)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: PRIVATE_API_PREFIX, version: '1' })
export class PrivateMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('media/upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: CurrentUser,
  ) {
    return this.mediaService.uploadFile(user.id, file);
  }

  @Get('media')
  getAll(@GetUser() user: CurrentUser, @Query() query: PaginationQueryDto) {
    return this.mediaService.getAll(user.id, query.page, query.limit);
  }

  @Get('media/:id')
  getOne(@GetUser() user: CurrentUser, @Param('id') id: string) {
    return this.mediaService.getById(user.id, id);
  }

  @Patch('media/:id')
  update(
    @GetUser() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateMediaDto,
  ) {
    return this.mediaService.updateMedia(user.id, id, dto);
  }

  @Delete('media/:id')
  delete(@GetUser() user: CurrentUser, @Param('id') id: string) {
    return this.mediaService.deleteMedia(user.id, id);
  }
}
