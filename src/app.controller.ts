// app.controller.ts
import { Controller, Get } from '@nestjs/common';
@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'OK',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    };
  }
}
