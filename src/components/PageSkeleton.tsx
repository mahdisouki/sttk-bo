export function PageSkeleton() {
  return (
    <div className="skeleton-page" aria-label="Chargement">
      <div className="skeleton-metrics">
        {[1, 2, 3, 4].map((item) => (
          <i key={item} />
        ))}
      </div>
      <div className="skeleton-panel">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
