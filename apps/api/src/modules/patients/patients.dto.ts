import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { HealthLogKind, MealType } from '@prisma/client';

export class CreateHealthLogDto {
  @IsEnum(HealthLogKind, { message: 'نوع داده سلامتی نامعتبر است' })
  kind: HealthLogKind;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  value?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  systolic?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  diastolic?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  text?: string;

  @IsOptional()
  @IsDateString()
  loggedAt?: string;
}

export class MealItemDto {
  @IsString()
  foodId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.25, { message: 'مقدار سروینگ نامعتبر است' })
  servings: number;
}

export class CreateMealDto {
  @IsEnum(MealType, { message: 'نوع وعده نامعتبر است' })
  type: MealType;

  @IsOptional()
  @IsDateString()
  eatenAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'حداقل یک غذا انتخاب کنید' })
  @ValidateNested({ each: true })
  @Type(() => MealItemDto)
  items: MealItemDto[];
}
