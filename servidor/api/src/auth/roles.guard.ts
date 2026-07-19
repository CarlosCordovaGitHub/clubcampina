import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolUsuario } from '@club-campina/shared-types';
import { IS_PUBLIC_KEY, ROLES_KEY, UsuarioJwt } from './decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const roles = this.reflector.getAllAndOverride<RolUsuario[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const user: UsuarioJwt | undefined = context
      .switchToHttp()
      .getRequest().user;
    if (!user || !roles.includes(user.rol)) {
      throw new ForbiddenException('Rol sin permisos para esta operación');
    }
    return true;
  }
}
