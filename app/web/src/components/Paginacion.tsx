export function Paginacion({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const paginas = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="paginacion">
      <span>
        Página {page} de {paginas} · {total} registros
      </span>
      <button
        className="secundario"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        ← Anterior
      </button>
      <button
        className="secundario"
        disabled={page >= paginas}
        onClick={() => onPage(page + 1)}
      >
        Siguiente →
      </button>
    </div>
  );
}
