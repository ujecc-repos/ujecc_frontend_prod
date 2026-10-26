
import Login from './pages/login';
import { useAuth } from './Auth/auth';
import { Navigate } from 'react-router-dom';

function App() {
  const { user } = useAuth();

  // next time it will be the next one coming to you.

  if (user) {
    return (
      <Navigate to={user.role === 'Membre' ? '/tableau-de-bord/messagerie' : '/tableau-de-bord'} replace />
    )
  }

  return (
    <>
      <Login/>
    </>
  )
}

export default App
