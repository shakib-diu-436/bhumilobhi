export default function LoadingState({ label = 'Loading records…' }: { label?: string }) {
  return <div className="state-card"><span className="spinner" /><span>{label}</span></div>;
}
