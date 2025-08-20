import { createBrowserRouter } from "react-router-dom";
import Dashboard from "../pages/dashboard";
import ProtectedRoute from "./protectedRoute";
import Membres from "../pages/admin/membres";
import PersonDetail from "../pages/person";
import Groupe from "../pages/admin/groupe";
import Onegroupe from "../pages/onegroupe";
import Pasteur from "../pages/admin/pasteur";
import Ministere from "../pages/admin/ministere";
import Evenements from "../pages/admin/evenements";
import EventDetails from "../pages/admin/event-details";
import Sanction from "../pages/admin/sanction";
import Mariage from "../pages/admin/mariage";
import CreationMariage from "../pages/admin/creation-mariage";
import Funeraille from "../pages/admin/funeraille";
import CreationFuneraille from "../pages/admin/creation-funeraille";
import Presentation from "../pages/admin/presentation";
import CreationPresentation from "../pages/admin/creation-presentation";
import Bapteme from "../pages/admin/bapteme";
import CreationBapteme from "../pages/admin/creation-bapteme";
import Comite from "../pages/admin/comite";
import EcoleDuDimanche from "../pages/admin/ecole-du-dimanche";
import Anniversaire from "../pages/admin/anniversaire";
import Transfert from "../pages/admin/transfert";
import RendezVous from "../pages/admin/rendez-vous";
import CreationRendezVous from "../pages/admin/creation-rendez-vous";
import Finance from "../pages/admin/finance";
import Depense from "../pages/admin/depense";
import Parametre from "../pages/parametre";
import MissionPage from "../pages/super-admin/mission";
import GestionPage from "../pages/super-admin/gestions";
import UserProfile from "../pages/profile";
import ChangePassword from "../pages/change-password";
import MainPage from "../pages/mainPage";
import PasteurPage from "../pages/director/pasteurs";
import App from "../App";
import AllChurches from "../pages/super-admin/allChurches";
import ServiceAndPresence from "../pages/admin/serviceandpresence";
import ServiceDetails from "../pages/admin/service-details";


const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                path: "/tableau-de-bord",
                element: <Dashboard />,
                children: [
                    {
                        index: true,
                        element: <MainPage/>
                        
                    },
                    {
                        path: "/tableau-de-bord/admin/membres",
                        element: <Membres/>
                    },
                    {
                        path: "/tableau-de-bord/admin/person/:id",
                        element: <PersonDetail/>
                    },
                    {
                        path: "/tableau-de-bord/admin/groupes",
                        element: <Groupe/>
                    },
                    {
                        path: "/tableau-de-bord/admin/groupe/:id",
                        element: <Onegroupe/>
                    },
                    {
                        path: "/tableau-de-bord/admin/pasteurs",
                        element: <Pasteur/>
                    }, 
                    {
                        path: "/tableau-de-bord/admin/ministères",
                        element: <Ministere/>
                    },
                    {
                        path: "/tableau-de-bord/admin/evenements",
                        element: <Evenements/>
                    },
                    {
                        path: "/tableau-de-bord/admin/evenements/:id",
                        element: <EventDetails/>
                    },
                    {
                        path: "/tableau-de-bord/admin/sanctions",
                        element: <Sanction/>
                    },
                    {
                        path: "/tableau-de-bord/admin/mariages",
                        element: <Mariage/>
                    },
                    {
                        path: "/tableau-de-bord/admin/mariages/creation",
                        element: <CreationMariage/>
                    },
                    {
                        path: "/tableau-de-bord/admin/funerailles",
                        element: <Funeraille/>
                    },
                    {
                        path: "/tableau-de-bord/admin/funerailles/creation",
                        element: <CreationFuneraille/>
                    },
                    {
                        path: "/tableau-de-bord/admin/presentation",
                        element: <Presentation/>
                    },
                    {
                        path: "/tableau-de-bord/admin/presentation/creation",
                        element: <CreationPresentation/>
                    },
                    {
                        path: "/tableau-de-bord/admin/bapteme",
                        element: <Bapteme/>
                    },
                    {
                        path: "/tableau-de-bord/admin/bapteme/creation",
                        element: <CreationBapteme/>
                    },
                    {
                        path: "/tableau-de-bord/admin/comite",
                        element: <Comite/>
                    },
                    {
                        path: "/tableau-de-bord/admin/ecole-du-dimanche",
                        element: <EcoleDuDimanche/>
                    },
                    { path: "/tableau-de-bord/admin/anniversaires",element: <Anniversaire/> },
                    { path: "/tableau-de-bord/admin/transferts", element: <Transfert/>  },
                    { path: "/tableau-de-bord/admin/rendez-vous", element: <RendezVous/> },
                    { path: "/tableau-de-bord/admin/rendez-vous/creation", element: <CreationRendezVous/> },
                    { path: "/tableau-de-bord/admin/finances", element: <Finance/> },
                    { path: "/tableau-de-bord/admin/depense", element: <Depense/> },
                    { path: "/tableau-de-bord/mon-compte", element: <UserProfile/> },
                    { path: "/tableau-de-bord/mon-compte/change-password", element: <ChangePassword/> },
                    // { path: "/tableau-de-bord/mon-compte/edit", element: <EditMonCompte/> },
                    { path: "/tableau-de-bord/parametre", element: <Parametre/> },
                    { path: "/tableau-de-bord/super-admin/missions", element: <MissionPage/> },
                    { path: "/tableau-de-bord/super-admin/gestions", element: <GestionPage/> },
                    // 
                    { path: "/tableau-de-bord/pasteurs", element: <PasteurPage/> },
                    { path: "/tableau-de-bord/super-admin/allchurches", element: <AllChurches/> },
                    { path: "/tableau-de-bord/admin/serviceandpresence", element: <ServiceAndPresence/> },
                    { path: "/tableau-de-bord/admin/service-details/:serviceId", element: <ServiceDetails/> },
                    
                ]
            }
        ]
    }
])

export default router