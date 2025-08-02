

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { useCreateChurchMutation } from '../store/services/churchApi';
import { useGetMissionsQuery } from '../store/services/mission';
import { signupSchema, type SignupFormData } from '../validations/auth';
import Ecclesys from "../assets/Ecclesys 1.png"

interface ChurchCreationPayload {
  name: string;
  size: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  mission?: string;
}

interface MissionOption {
  value: string;
  label: string;
}

export default function Enregistrer() {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedMission, setSelectedMission] = useState<MissionOption | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const [createChurch, { isLoading }] = useCreateChurchMutation();
  const { data: missions, isLoading: missionsLoading } = useGetMissionsQuery();

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      churchName: '',
      churchSize: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      missionName: undefined,
    },
  });

  // Format missions data for react-select
  const missionOptions: MissionOption[] = missions ? missions.map(mission => ({
    value: mission.id,
    label: mission.missionName
  })) : [];

  const onSubmit = async (data: SignupFormData) => {
    try {
      // Clear any previous server errors
      setServerError(null);
      
      const payload: ChurchCreationPayload = {
        name: data.churchName,
        size: data.churchSize,
        firstname: data.firstName,
        lastname: data.lastName,
        email: data.email,
        password: data.password,
      };
      
      // Only add mission if it exists
      if (data.missionName) {
        payload.mission = data.missionName;
      }
      
      await createChurch(payload).unwrap();
      navigate('/login');
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle different types of errors
      if (error?.status === 409) {
        setServerError('Cette adresse email est déjà utilisée. Veuillez en choisir une autre.');
      } else if (error?.status === 400) {
        setServerError('Données invalides. Veuillez vérifier vos informations.');
      } else if (error?.status === 422) {
        setServerError('Format de données incorrect. Veuillez vérifier vos informations.');
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
            {/* Church Name Input */}
            <div>
              <div className="relative">
                <div className="absolute top-0 left-0 h-12 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <Controller
                  control={control}
                  name="churchName"
                  render={({ field: { onChange, value } }) => (
                    <input
                      type="text"
                      value={value}
                      onChange={onChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.churchName ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Nom Église"
                    />
                  )}
                />
              </div>
              {errors.churchName && (
                <p className="mt-1 text-sm text-red-600">{errors.churchName.message}</p>
              )}
            </div>

            {/* Church Size Input */}
            <div>
              <div className="relative">
                <div className="absolute top-0 left-0 h-12 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <Controller
                  control={control}
                  name="churchSize"
                  render={({ field: { onChange, value } }) => (
                    <input
                      type="number"
                      value={value}
                      onChange={onChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.churchSize ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Le nombre d'adhérents"
                    />
                  )}
                />
              </div>
              {errors.churchSize && (
                <p className="mt-1 text-sm text-red-600">{errors.churchSize.message}</p>
              )}
            </div>

            {/* Mission Selection */}
            <div>
              <Controller
                control={control}
                name="missionName"
                render={({ field: { onChange, value } }) => (
                  <Select
                    options={missionOptions}
                    value={selectedMission}
                    onChange={(option) => {
                      setSelectedMission(option);
                      onChange(option?.value || undefined);
                    }}
                    isLoading={missionsLoading}
                    placeholder="Sélectionner une mission"
                    noOptionsMessage={() => "Aucun résultat trouvé 😢"}
                    className={`react-select-container ${
                      errors.missionName ? 'react-select-error' : ''
                    }`}
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        backgroundColor: '#f9fafb',
                        borderColor: errors.missionName ? '#f87171' : state.isFocused ? '#14b8a6' : '#d1d5db',
                        borderRadius: '0.5rem',
                        padding: '0.25rem',
                        minHeight: '48px',
                        boxShadow: state.isFocused ? '0 0 0 2px rgba(20, 184, 166, 0.2)' : 'none',
                        '&:hover': {
                          borderColor: state.isFocused ? '#14b8a6' : '#9ca3af'
                        }
                      }),
                      placeholder: (provided) => ({
                        ...provided,
                        color: '#6b7280'
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#14b8a6' : state.isFocused ? '#f0fdfa' : 'white',
                        color: state.isSelected ? 'white' : '#374151',
                        '&:hover': {
                          backgroundColor: state.isSelected ? '#14b8a6' : '#f0fdfa'
                        }
                      })
                    }}
                  />
                )}
              />
              {errors.missionName && (
                <p className="mt-1 text-sm text-red-600">{errors.missionName.message}</p>
              )}
            </div>

            {/* Name Fields */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute top-0 left-0 h-12 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <Controller
                    control={control}
                    name="firstName"
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="text"
                        value={value}
                        onChange={onChange}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          errors.firstName ? 'border-red-400' : 'border-gray-300'
                        }`}
                        placeholder="Nom"
                      />
                    )}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute top-0 left-0 h-12 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <Controller
                    control={control}
                    name="lastName"
                    render={({ field: { onChange, value } }) => (
                      <input
                        type="text"
                        value={value}
                        onChange={onChange}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          errors.lastName ? 'border-red-400' : 'border-gray-300'
                        }`}
                        placeholder="Prénom"
                      />
                    )}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

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
                      onChange={onChange}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.email ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Address Électronique"
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

            {/* Signup Button */}
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
                  Création en cours...
                </div>
              ) : (
                "Créer un compte"
              )}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <span className="text-gray-600">Avez-vous déjà un compte? </span>
              <Link to="/" className="font-semibold text-teal-500 hover:text-teal-600">
                Connecter
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}