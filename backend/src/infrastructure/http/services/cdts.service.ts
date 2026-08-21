// backend/src/infrastructure/http/services/cdts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CdtDbEntity } from '../../database/entities/cdt.entity';
import { CreateCdtDto } from '../../../../../shared/models/cdts/cdt.dto';
import { UserDbEntity } from '../../database/entities/user.entity';

@Injectable()
export class CdtsService {
  constructor(
    @InjectRepository(CdtDbEntity)
    private readonly cdtsRepository: Repository<CdtDbEntity>,
    @InjectRepository(UserDbEntity)
    private readonly usersRepository: Repository<UserDbEntity>,
  ) {}

  async create(createDto: CreateCdtDto, userId: number): Promise<CdtDbEntity> {
    const user = await this.usersRepository.findOne({ 
      where: { id: userId }, 
      relations: ['household'] 
    });
    
    if (!user || !user.household) {
      throw new NotFoundException('User or household not found');
    }

    const newCdt = this.cdtsRepository.create({
      ...createDto,
      owner: { id: userId },
      household: { id: user.household.id },
      sharedWith: createDto.sharedWith || [],
    });

    return await this.cdtsRepository.save(newCdt);
  }

  async findAllForHousehold(householdId: number, userId: number): Promise<CdtDbEntity[]> {
    // A user can see:
    // 1. Their own CDTs
    // 2. Public CDTs in their household where sharedWith is empty (shared with everyone) OR includes their userId.
    const query = this.cdtsRepository.createQueryBuilder('cdt')
      .leftJoinAndSelect('cdt.owner', 'owner')
      .where('cdt.household_id = :householdId', { householdId })
      .andWhere(
        '(cdt.owner_id = :userId OR (cdt.is_public = true AND (cdt.shared_with IS NULL OR cdt.shared_with = "" OR cdt.shared_with LIKE :userIdPattern)))',
        { userId, userIdPattern: `%${userId}%` }
      )
      .orderBy('cdt.created_at', 'DESC');

    return await query.getMany();
  }
}
