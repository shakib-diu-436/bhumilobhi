type Props = { children: string; tone?: 'green' | 'red' | 'amber' | 'blue' | 'gray' };
export default function StatusBadge({ children, tone = 'gray' }: Props) {
  return <span className={`badge badge-${tone}`}><span className="badge-dot" />{children.replaceAll('_', ' ')}</span>;
}
