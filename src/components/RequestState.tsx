export const Loading = ({ label, variant = 'cards' }: { label: string; variant?: 'cards' | 'chart' }) => (
  <div>
    <p role="status" className="loading">
      {label}
    </p>
    {variant === 'cards' ? (
      <div className="cards" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card skeleton skeleton-card" />
        ))}
      </div>
    ) : (
      <div className="skeleton skeleton-chart" aria-hidden="true" />
    )}
  </div>
);

export const ErrorMessage = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div role="alert" className="error">
    <div>
      <strong>Something went wrong</strong>
      <p>{message}</p>
    </div>
    <button className="btn btn-primary" onClick={onRetry}>
      Retry
    </button>
  </div>
);
