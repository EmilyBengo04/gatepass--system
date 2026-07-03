import { DashboardIcon, PeopleIcon, ActivityIcon, SettingsIcon, ReportIcon, BuildingIcon } from "../../components/icons";

export const ADMIN_NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: DashboardIcon },
  { to: "/admin/employees", label: "Employees", icon: PeopleIcon },
  { to: "/admin/officers", label: "Security officers", icon: BuildingIcon },
  { to: "/admin/users", label: "User accounts", icon: SettingsIcon },
  { to: "/admin/logs", label: "Activity log", icon: ActivityIcon },
  { to: "/admin/reports", label: "Reports", icon: ReportIcon },
];
