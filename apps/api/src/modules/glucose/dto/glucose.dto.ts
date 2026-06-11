import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MeasurementContext } from '@prisma/client';

export class CreateGlucoseLogDto {
  @Type(() => Number)
  @IsInt({ message: 'مقدار قند باید عدد صحیح باشد' })
  @Min(20, { message: 'مقدار قند خارج از محدوده معتبر است' })
  @Max(600, { message: 'مقدار قند خارج از محدوده معتبر است' })
  valueMgDl: number;

  @IsOptional()
  @IsEnum(MeasurementContext, { message: 'زمینه اندازه‌گیری نامعتبر است' })
  context?: MeasurementContext;

  @IsOptional()
  @IsDateString({}, { message: 'تاریخ اندازه‌گیری نامعتبر است' })
  measuredAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class GlucoseQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
