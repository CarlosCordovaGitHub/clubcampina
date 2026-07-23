import type { LucideIcon } from 'lucide-react';

export function PageHeader({
  icono: Icono,
  titulo,
  descripcion,
  acciones,
}: {
  icono?: LucideIcon;
  titulo: string;
  descripcion?: string;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div className="page-header-texto">
        {Icono && (
          <span className="page-header-icono">
            <Icono size={20} strokeWidth={2} />
          </span>
        )}
        <div>
          <h1>{titulo}</h1>
          {descripcion && <p className="descripcion">{descripcion}</p>}
        </div>
      </div>
      {acciones && <div className="page-header-acciones">{acciones}</div>}
    </div>
  );
}
