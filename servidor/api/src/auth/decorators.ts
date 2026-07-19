import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RolUsuario } from '@club-campina/shared-types';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);

export interface UsuarioJwt {
  sub: string;
  email: string;
  rol: RolUsuario;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioJwt | undefined =>
    ctx.switchToHttp().getRequest().user,
);
