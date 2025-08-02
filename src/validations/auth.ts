import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'L\'adresse électronique est requise')
    .email('L\'adresse électronique n\'est pas valide'),
  password: z.string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
});

export const signupSchema = z.object({
  churchName: z.string()
    .min(1, 'Le nom de l\'église est requis')
    .min(3, 'Le nom de l\'église doit contenir au moins 3 caractères'),
  churchSize: z.string()
    .min(1, 'Le nombre d\'adhérents est requis')
    .regex(/^\d+$/, 'Le nombre d\'adhérents doit être un nombre'),
  firstName: z.string()
    .min(1, 'Le prénom est requis')
    .min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string()
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string()
    .min(1, 'L\'adresse électronique est requise')
    .email('L\'adresse électronique n\'est pas valide'),
  password: z.string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  missionName: z.string().optional()
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;