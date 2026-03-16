import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SignalingModule } from './signaling/signaling.module';

@Module({
  controllers: [AppController],
  imports: [SignalingModule],
})
export class AppModule {}
