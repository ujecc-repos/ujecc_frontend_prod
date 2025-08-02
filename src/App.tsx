
import Login from './pages/login';
import { useAuth } from './Auth/auth';
import { Navigate } from 'react-router-dom';

function App() {
  const { user } = useAuth();

  if (user) {
    return (
      <Navigate to="/tableau-de-bord" replace />
    )
  }

  return (
    <>
      <Login/>
    </>
  )
}

export default App
