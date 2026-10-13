export default function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="error-state"><div className="error-icon">!</div><div><strong>Could not load data</strong><p>{message}</p>{onRetry && <button className="button button-secondary button-small" onClick={onRetry}>Try again</button>}</div></div>;
}
