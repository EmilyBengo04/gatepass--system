import { DashboardIcon, PeopleIcon, VisitorIcon, ActivityIcon, SettingsIcon } from "../../components/icons";

export const NAV_ITEMS = [
  { to: "/security", label: "Dashboard", icon: DashboardIcon },
  { to: "/security/employees", label: "Employees", icon: PeopleIcon },
  { to: "/security/visitors", label: "Visitors", icon: VisitorIcon },
  { to: "/security/activity", label: "Activity log", icon: ActivityIcon },
  { to: "/security/settings", label: "Settings", icon: SettingsIcon },
];
