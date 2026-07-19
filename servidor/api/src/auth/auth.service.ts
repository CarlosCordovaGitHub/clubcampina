import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginRespuesta, RolUsuario } from '@club-campina/shared-types';
import { PrismaService } from '../database/prisma.service';

// AuthService aislado: para SSO/MFA futuro se reemplaza esta clase sin tocar
// guards ni controladores (punto de extensión documentado en el plan).
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginRespuesta> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !(await bcrypt.compare(password, usuario.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol as RolUsuario,
      },
    };
  }
}
