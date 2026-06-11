import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class RxItemDto {
  @IsString()
  @IsNotEmpty({ message: 'نام دارو الزامی است' })
  drugName: string;

  @IsString()
  @IsNotEmpty({ message: 'دوز دارو الزامی است' })
  dosage: string;

  @IsString()
  @IsNotEmpty({ message: 'تواتر مصرف الزامی است' })
  frequency: string;

  @IsString()
  @IsNotEmpty({ message: 'مدت مصرف الزامی است' })
  duration: string;

  @IsOptional()
  @IsString()
  instruction?: string;
}

export class CreatePrescriptionDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  diagnosis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  dietPlan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  exercisePlan?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'حداقل یک دارو ثبت کنید' })
  @ValidateNested({ each: true })
  @Type(() => RxItemDto)
  items: RxItemDto[];
}

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty({ message: 'عنوان قالب الزامی است' })
  title: string;

  @IsObject()
  body: Record<string, unknown>;
}
