import DashboardLayout from "../layout/dashboadLayout"


export default function Dashboard() {
type UserRole = 'Admin' | 'SuperAdmin' | 'Directeur' | "Invite" | "Leader";

  const role = localStorage.getItem("role") as UserRole
  return (
    
    <>
      <DashboardLayout userRole={`${role}`} />
    </>
  )
}