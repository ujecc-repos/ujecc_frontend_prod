import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import router from './route/mainRoute'
import { RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux';
import { store } from "./store/store";
import { AuthProvider } from './Auth/auth'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </Provider>
  </StrictMode>,
)

