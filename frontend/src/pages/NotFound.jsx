import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';

function NotFound() {
  return (
    <div className="not-found-page">
      <KeyRound size={56} />
      <h1>404</h1>
      <h2>Looks like you've lost the key.</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className="btn btn-primary">
        Back to Vault
      </Link>
    </div>
  );
}

export default NotFound;
