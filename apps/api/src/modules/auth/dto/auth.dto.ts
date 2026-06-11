import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone: string;

  @IsString()
  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'نام و نام خانوادگی الزامی است' })
  fullName: string;

  @IsOptional()
  @IsEnum(['PATIENT', 'DOCTOR'], { message: 'نقش نامعتبر است' })
  role?: 'PATIENT' | 'DOCTOR';
}

export class LoginDto {
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
