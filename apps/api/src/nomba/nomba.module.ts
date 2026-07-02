import { Module } from '@nestjs/common';
import { NombaService } from './nomba.service';

/**
 * Module responsible for exporting NombaService integrations to the rest of the application.
 */
@Module({
  imports: [],
  providers: [NombaService],
  exports: [NombaService],
})
export class NombaModule {}
