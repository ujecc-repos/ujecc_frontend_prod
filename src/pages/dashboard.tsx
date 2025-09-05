import DashboardLayout from "../layout/dashboadLayout"


export default function Dashboard() {
type UserRole = 'Admin' | 'SuperAdmin' | 'Directeur' | "Invite";

  const role = localStorage.getItem("role") as UserRole
  return (
    <>
      <DashboardLayout userRole={`${role}`} />
    </>
  )
}