import DashboardLayout from "../layout/dashboadLayout"
import { useAuth } from "../Auth/auth";


export default function Dashboard() {
type UserRole = 'Admin' | 'SuperAdmin' | 'Directeur' | "Invite" | "Leader" | "Membre";

  const { user } = useAuth();
  const role = (user?.role || localStorage.getItem("role")) as UserRole;
  return (
    
    <>
      <DashboardLayout userRole={`${role}`} />
    </>
  )
}
