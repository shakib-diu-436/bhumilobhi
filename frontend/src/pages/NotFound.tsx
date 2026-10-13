import { Link } from 'react-router-dom';
export default function NotFound() { return <div className="not-found"><span>404</span><h1>Page not found</h1><p>The page you requested does not exist in this workspace.</p><Link className="button button-primary" to="/">Back to overview</Link></div>; }
