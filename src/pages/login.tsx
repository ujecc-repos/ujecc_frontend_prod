
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLoginMutation } from '../store/services/authApi';
import { useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormData } from '../validations/auth';
import { useAuth } from '../Auth/auth';
import Ecclesys from "../assets/Ecclesys 1.png"
import { ArrowDownTrayIcon, ShareIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const getIsIOS = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
};

const getIsStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS] = useState(getIsIOS);
  const [isInstalled, setIsInstalled] = useState(getIsStandalone);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [installMessage, setInstallMessage] = useState<string | null>(null);

  const [loginMutation, { isLoading }] = useLoginMutation();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallMessage(null);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowIOSInstructions(false);
      setInstallMessage('Ecclesys a été installé avec succès.');
    };

    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!installPrompt) {
      setInstallMessage("Ouvrez le menu de votre navigateur, puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».");
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallMessage('Installation en cours…');
    } else {
      setInstallMessage('Installation annulée. Vous pourrez réessayer à tout moment.');
    }
    setInstallPrompt(null);
  };

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Clear any previous server errors
      setServerError(null);
      
      const result = await loginMutation(data).unwrap();
      
      // Use the login function from AuthContext to update both localStorage and context state
      login(result.user, result.token);
      localStorage.setItem("role", result.user.role)
      navigate(result.user.role === 'Membre' ? '/tableau-de-bord/messagerie' : '/tableau-de-bord')
    } catch (error: any) {
      // Handle different types of errors
      if (error?.status === 401) {
        setServerError('Email ou mot de passe incorrect. Veuillez réessayer.');
      } else if (error?.status === 403) {
        setServerError('Accès refusé. Votre compte pourrait être désactivé.');
      } else if (error?.status === 429) {
        setServerError('Trop de tentatives de connexion. Veuillez réessayer plus tard.');
      } else if (error?.status >= 500) {
        setServerError('Erreur du serveur. Veuillez réessayer plus tard.');
      } else if (error?.name === 'NetworkError' || !error?.status) {
        setServerError('Problème de connexion. Vérifiez votre connexion internet.');
      } else if (error?.data?.message) {
        setServerError(error.data.message);
      } else {
        setServerError('Une erreur inattendue s\'est produite. Veuillez réessayer.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo Container */}
        <div className="flex justify-center mb-10">
          <div className="w-30 h-30 rounded-full flex items-center justify-center">
            <img src={Ecclesys} alt="Logo" className="w-30 h-30" />
            {/* <span className="text-2xl font-bold text-gray-600">LOGO</span> */}
          </div>
        </div>
        
        {/* Form Container */}
        <div className="bg-white py-8 px-4 sm:px-10">
          {/* Server Error Message */}
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Input */}
            <div>
              <div className="relative">
                <div className="absolute top-0 left-0 h-12 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <input
                      type="email"
                      value={value}
                      autoComplete="off"
                      onChange={onChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.email ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Email ou Téléphone"
                    />
                  )}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="relative">
                <div className="absolute top-0 left-0 h-12 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={value}
                      autoComplete='off'
                      onChange={onChange}
                      className={`block w-full pl-10 pr-10 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.password ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Mot de Passe"
                    />
                  )}
                />
                <button
                  type="button"
                  className="absolute top-0 right-0 h-12 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    )}
                  </svg>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-5 h-5 border-2 border-teal-500 rounded flex items-center justify-center mr-2 ${
                  rememberMe ? 'bg-teal-500' : 'bg-white'
                }`}
              >
                {rememberMe && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-gray-600">Se souvenir de moi</span>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-semibold text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Connecter</span>
                  <span className="text-xl">➜</span>
                </div>
              )}
            </button>
          </form>

          {!isInstalled && (
            <div className="mt-7 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={() => void handleInstall()}
                className="group flex w-full items-center justify-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 transition-all hover:border-teal-300 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm transition-transform group-hover:-translate-y-0.5">
                  <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-left">
                  <span className="block">Installer Ecclesys</span>
                  <span className="block text-xs font-normal text-teal-700/80">
                    Accès rapide et fonctionnement hors connexion
                  </span>
                </span>
              </button>
              {installMessage && (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs leading-5 text-slate-600">
                  {installMessage}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {showIOSInstructions && (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-900/20 p-4 backdrop-blur-[1px] sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setShowIOSInstructions(false);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                  <ArrowDownTrayIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="ios-install-title" className="font-semibold text-slate-900">Installer sur iPhone ou iPad</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Utilisez Safari pour ajouter Ecclesys.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSInstructions(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label="Fermer"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <ol className="space-y-4 px-5 py-5 text-sm text-slate-700">
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-800">1</span>
                <span>Ouvrez cette page dans <strong className="font-semibold text-slate-900">Safari</strong>.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-800">2</span>
                <span className="flex items-center gap-2">Touchez le bouton <ShareIcon className="h-5 w-5 text-blue-600" aria-label="Partager" /> <strong className="font-semibold text-slate-900">Partager</strong>.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-800">3</span>
                <span>Sélectionnez <strong className="font-semibold text-slate-900">Sur l’écran d’accueil</strong>, puis touchez <strong className="font-semibold text-slate-900">Ajouter</strong>.</span>
              </li>
            </ol>

            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowIOSInstructions(false)}
                className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                J’ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
