import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller({
  path: '/users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/register')
  register(@Body() dto: CreateUserDto) {
    return this.usersService.register(dto);
  }

  @Post('/login')
  login(@Body() dto: LoginDto) {
    return this.usersService.login(dto);
  }
}
