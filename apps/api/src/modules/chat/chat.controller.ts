import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';

class SendMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'متن پیام خالی است' })
  @MaxLength(2000)
  body: string;
}

class OpenConversationDto {
  @IsString()
  @IsNotEmpty()
  partnerUserId: string;
}

@Controller('chat')
export class ChatController {
  constructor(private chat: ChatService) {}

  @Get('partners')
  partners(@CurrentUser() user: JwtUser) {
    return this.chat.partners(user.sub, user.role);
  }

  @Get('conversations')
  conversations(@CurrentUser() user: JwtUser) {
    return this.chat.myConversations(user.sub);
  }

  @Post('conversations')
  open(@CurrentUser() user: JwtUser, @Body() dto: OpenConversationDto) {
    return this.chat.getOrCreate(user.sub, user.role, dto.partnerUserId);
  }

  @Get('conversations/:id/messages')
  messages(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.chat.messages(id, user.sub);
  }

  @Post('conversations/:id/messages')
  send(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.chat.send(id, user.sub, dto.body);
  }
}
