import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Landing from './pages/Landing';
import AdminLogin from './pages/AdminLogin';
import Kids from './pages/Kids';
import Play from './pages/Play';
import Parent from './pages/Parent';
import Admin from './pages/Admin';
import { Loader } from './components/ui';

function Guard({ role, children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  if (!user) return <Navigate to={role === 'publisher' ? '/publisher' : '/'} replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'publisher' ? '/admin' : '/kids'} replace />;
  return children;
}

export default function App() {
  const { user, ready } = useAuth();
  return (
    <Routes>
      <Route path="/" element={!ready ? <Loader /> : user ? <Navigate to={user.role === 'publisher' ? '/admin' : '/kids'} replace /> : <Landing />} />
      <Route path="/publisher" element={<AdminLogin />} />
      <Route path="/kids" element={<Guard role="parent"><Kids /></Guard>} />
      <Route path="/play" element={<Guard role="parent"><Play /></Guard>} />
      <Route path="/parent" element={<Guard role="parent"><Parent /></Guard>} />
      <Route path="/admin" element={<Guard role="publisher"><Admin /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
