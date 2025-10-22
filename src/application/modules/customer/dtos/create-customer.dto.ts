import { IsEmail, IsNotEmpty, IsString, IsPhoneNumber, Matches } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, { message: 'Documento deve conter exatamente 11 dígitos numéricos' })
  document: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,11}$/, { message: 'Telefone deve conter 10 ou 11 dígitos numéricos' })
  phone: string;
}

