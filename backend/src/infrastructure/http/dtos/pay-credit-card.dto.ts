// backend/src/infrastructure/http/dtos/pay-credit-card.dto.ts
import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PayCreditCardDto as IPayCreditCardDto } from '@shared/index';

export class PayCreditCardDto implements IPayCreditCardDto {
  @ApiProperty({ description: 'ID de la tarjeta de crédito a pagar', example: 1 })
  @IsInt()
  @IsNotEmpty()
  creditCardId: number;

  @ApiProperty({ description: 'ID de la cuenta bancaria de donde sale el dinero', example: 2 })
  @IsInt()
  @IsNotEmpty()
  accountId: number;

  @ApiProperty({ description: 'Monto total a abonar al saldo de la tarjeta', example: 250000 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;
}
