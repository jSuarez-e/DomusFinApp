// backend/src/infrastructure/http/controllers/users.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, ParseIntPipe, UseGuards, Request, NotFoundException, Body, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserDbEntity } from '../../database/entities/user.entity';
import { HouseholdDbEntity } from '../../database/entities/household.entity';
import { User } from '@shared/index';
import { PasswordHasher, encryptInvitationCode } from '../services/auth.service';
import { UpdatePasswordDto, UpdateEmailDto, UpdatePreferencesDto } from '../dtos/settings.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(UserDbEntity)
    private readonly userRepository: Repository<UserDbEntity>,
    @InjectRepository(HouseholdDbEntity)
    private readonly householdRepository: Repository<HouseholdDbEntity>,
  ) {}

  @Get('members')
  @ApiOperation({ summary: 'Obtener miembros del hogar activo' })
  @ApiResponse({ status: 200, description: 'Miembros del hogar' })
  async getMembers(@Request() req: { user: User }) {
    if (!req.user.householdId) {
      return [];
    }
    return this.userRepository.find({
      where: { householdId: req.user.householdId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      }
    });
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Actualizar rol de un miembro del hogar (Admin)' })
  @ApiResponse({ status: 200, description: 'Rol actualizado correctamente.' })
  async updateMemberRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: string,
    @Request() req: { user: User }
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('No tienes permisos de administrador.');
    }

    if (!role || !['admin', 'user'].includes(role)) {
      throw new BadRequestException('Rol inválido. Los roles permitidos son admin y user.');
    }

    const member = await this.userRepository.findOneBy({ id, householdId: req.user.householdId ?? undefined });
    if (!member) {
      throw new NotFoundException('Miembro no encontrado en este hogar.');
    }

    member.role = role;
    await this.userRepository.save(member);

    return { success: true, message: `Rol actualizado a ${role} para el usuario ${member.name}.` };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar de forma lógica un miembro del hogar (Admin)' })
  @ApiResponse({ status: 200, description: 'Miembro desactivado correctamente.' })
  async deleteMember(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: User }
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('No tienes permisos de administrador.');
    }

    if (id === req.user.id) {
      throw new BadRequestException('No puedes desactivarte a ti mismo.');
    }

    const member = await this.userRepository.findOneBy({ id, householdId: req.user.householdId ?? undefined });
    if (!member) {
      throw new NotFoundException('Miembro no encontrado en este hogar.');
    }

    member.isActive = false;
    await this.userRepository.save(member);

    return { success: true, message: `Usuario ${member.name} desactivado del hogar.` };
  }

  @Get('households')
  @ApiOperation({ summary: 'Obtener los hogares (inquilinos) disponibles para selección' })
  @ApiResponse({ status: 200, description: 'Listado de hogares' })
  async getHouseholds(@Request() req: { user: User }) {
    // Para simplificar la demo y habilitar el cambio multihogar, retornamos todos los hogares en el sistema.
    // Esto permite al usuario alternar entre diferentes entornos.
    const list = await this.householdRepository.find({
      order: { id: 'ASC' },
      take: 5
    });

    return list;
  }

  @Post('switch-household/:id')
  @ApiOperation({ summary: 'Cambiar el inquilino (hogar) activo del usuario' })
  @ApiResponse({ status: 200, description: 'Cambio de hogar exitoso' })
  @ApiResponse({ status: 404, description: 'Hogar no encontrado' })
  async switchHousehold(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: User }
  ) {
    const household = await this.householdRepository.findOneBy({ id });
    if (!household) {
      throw new NotFoundException('Hogar no encontrado');
    }

    // Actualizar el householdId del usuario autenticado
    const user = await this.userRepository.findOneBy({ id: req.user.id });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.householdId = household.id;
    await this.userRepository.save(user);

    return {
      status: 'success',
      message: `Hogar cambiado exitosamente a: ${household.name}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        householdId: user.householdId,
        currency: user.currency,
        dateFormat: user.dateFormat,
        avatar: user.avatar,
      }
    };
  }

  @Post('delete-account')
  @ApiOperation({ summary: 'Eliminar de forma lógica la cuenta del usuario' })
  @ApiResponse({ status: 200, description: 'Cuenta desactivada con éxito' })
  async deleteAccount(
    @Body('password') password: string,
    @Request() req: { user: User }
  ) {
    if (!password) {
      throw new BadRequestException('La contraseña es obligatoria.');
    }

    const user = await this.userRepository.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: req.user.id })
      .getOne();

    if (!user || !user.password) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isValid = PasswordHasher.verify(password, user.password);
    if (!isValid) {
      throw new BadRequestException('La contraseña es incorrecta.');
    }

    user.isActive = false;
    await this.userRepository.save(user);

    return { success: true, message: 'Cuenta desactivada correctamente.' };
  }

  @Patch('settings/password')
  @ApiOperation({ summary: 'Actualizar contraseña del usuario activo' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada con éxito' })
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @Request() req: { user: User }
  ) {
    if (!dto.currentPassword || !dto.newPassword) {
      throw new BadRequestException('La contraseña actual y la nueva son obligatorias.');
    }

    const user = await this.userRepository.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: req.user.id })
      .getOne();

    if (!user || !user.password) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isValid = PasswordHasher.verify(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('La contraseña actual es incorrecta.');
    }

    user.password = PasswordHasher.hash(dto.newPassword);
    await this.userRepository.save(user);

    return { success: true, message: 'Contraseña actualizada con éxito.' };
  }

  @Patch('settings/email')
  @ApiOperation({ summary: 'Actualizar correo electrónico del usuario activo' })
  @ApiResponse({ status: 200, description: 'Correo electrónico actualizado con éxito' })
  async updateEmail(
    @Body() dto: UpdateEmailDto,
    @Request() req: { user: User }
  ) {
    if (!dto.newEmail) {
      throw new BadRequestException('El nuevo correo electrónico es obligatorio.');
    }

    const existingUser = await this.userRepository.findOneBy({ email: dto.newEmail });
    if (existingUser && existingUser.id !== req.user.id) {
      throw new ConflictException('El correo electrónico ya está registrado por otro usuario.');
    }

    const user = await this.userRepository.findOneBy({ id: req.user.id });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.email = dto.newEmail;
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Correo electrónico actualizado con éxito.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        householdId: user.householdId,
        currency: user.currency,
        dateFormat: user.dateFormat,
        avatar: user.avatar,
      }
    };
  }

  @Patch('settings/preferences')
  @ApiOperation({ summary: 'Actualizar preferencias visuales del usuario activo' })
  @ApiResponse({ status: 200, description: 'Preferencias actualizadas con éxito' })
  async updatePreferences(
    @Body() dto: UpdatePreferencesDto,
    @Request() req: { user: User }
  ) {
    const user = await this.userRepository.findOneBy({ id: req.user.id });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.currency) {
      user.currency = dto.currency;
    }
    if (dto.dateFormat) {
      user.dateFormat = dto.dateFormat;
    }

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Preferencias actualizadas con éxito.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        householdId: user.householdId,
        currency: user.currency,
        dateFormat: user.dateFormat,
        avatar: user.avatar,
      }
    };
  }

  @Patch('settings/avatar')
  @ApiOperation({ summary: 'Actualizar foto de perfil / avatar' })
  @ApiResponse({ status: 200, description: 'Avatar actualizado con éxito' })
  async updateAvatar(
    @Body('avatar') avatar: string,
    @Request() req: { user: User }
  ) {
    const user = await this.userRepository.findOneBy({ id: req.user.id });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.avatar = avatar || null;
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Avatar actualizado con éxito.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        householdId: user.householdId,
        currency: user.currency,
        dateFormat: user.dateFormat,
        avatar: user.avatar,
      }
    };
  }

  @Post('invite')
  @ApiOperation({ summary: 'Enviar una invitación por correo electrónico a un nuevo miembro' })
  @ApiResponse({ status: 201, description: 'Invitación enviada correctamente' })
  async inviteMember(
    @Body('email') email: string,
    @Request() req: { user: User }
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('No tienes permisos de administrador.');
    }

    if (!req.user.householdId) {
      throw new BadRequestException('No perteneces a ningún hogar para poder invitar.');
    }

    if (!email) {
      throw new BadRequestException('El correo de destino es obligatorio.');
    }

    const plainCode = `HOGAR-${req.user.householdId}`;
    const inviteCode = encryptInvitationCode(plainCode);
    const magicLink = `http://localhost:8100/register?code=${inviteCode}`;

    // Nodemailer SMTP integration
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || '"DomusFinApp" <no-reply@domusfin.com>';

    let emailSent = false;
    let errorMsg = '';

    if (host && user && pass) {
      let nodemailerLib: unknown;
      try {
        const nodemailerPackageName = 'nodemailer';
        nodemailerLib = require(nodemailerPackageName);
      } catch (err: unknown) {
        console.warn('nodemailer is not installed. SMTP delivery failed.', err);
        errorMsg = 'Nodemailer package is not installed in the system dependencies.';
      }

      if (nodemailerLib) {
        try {
          type NodemailerType = {
            createTransport(options: Record<string, unknown>): {
              verify(): Promise<void>;
              sendMail(options: Record<string, unknown>): Promise<void>;
            };
          };

          const transporter = (nodemailerLib as NodemailerType).createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
          });

          // Validate the real SMTP connection
          await transporter.verify();

          await transporter.sendMail({
            from,
            to: email,
            subject: '¡Te han invitado a unirte a DomusFinApp!',
            text: `Registra tu cuenta ingresando el código: ${inviteCode}\nEnlace Mágico: ${magicLink}`,
            html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2>¡Hola!</h2>
              <p>Te han invitado a unirte a un hogar en <strong>DomusFinApp</strong>.</p>
              <p>Para registrarte, haz clic en el siguiente enlace:</p>
              <p><a href="${magicLink}" style="display: inline-block; padding: 10px 20px; background-color: #5c2e7e; color: white; text-decoration: none; border-radius: 5px;">Unirse al Hogar</a></p>
              <p>O ingresa el código de invitación manualmente: <code>${inviteCode}</code></p>
            </div>`,
          });

          emailSent = true;
        } catch (err: unknown) {
          console.error('Real SMTP delivery failed, falling back to simulated output.', err);
          errorMsg = err instanceof Error ? err.message : 'Unknown SMTP Error';
        }
      }
    }

    // Always log in console as a fallback / backup log trace
    console.log('\n======================================================');
    console.log(`✉️ ENVIANDO CORREO DE INVITACIÓN (${emailSent ? 'SMTP REAL' : 'SIMULADO'})`);
    console.log(`Para: ${email}`);
    console.log(`Asunto: ¡Te han invitado a unirte a DomusFinApp!`);
    console.log(`Mensaje: Registra tu cuenta ingresando el código: ${inviteCode}`);
    console.log(`Enlace Mágico: ${magicLink}`);
    if (errorMsg) {
      console.log(`Error SMTP: ${errorMsg}`);
    }
    console.log('======================================================\n');

    return {
      success: true,
      message: emailSent 
        ? 'Invitación enviada por correo electrónico con éxito.' 
        : 'Invitación generada y simulada correctamente (SMTP no configurado o fallido).',
      inviteCode,
      magicLink,
      emailSent
    };
  }
}
