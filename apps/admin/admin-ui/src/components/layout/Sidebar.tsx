import React from "react";
import { NavLink } from "react-router-dom";
import type { NavGroup, NavItem } from "@coturn-cluster/shared/src/types";
import { AppRoute } from "../../routes/routes";

const navigationGroups: NavGroup[] = [
  {
    title: "Dashboard",
    items: [{ name: "Overview", path: AppRoute.HOME, icon: "📊" }],
  },
  {
    title: "Cluster Management",
    items: [
      { name: "Nodes", path: AppRoute.NODES, icon: "🖥️" },
      { name: "Services", path: AppRoute.SERVICES, icon: "🔧" },
      { name: "Load Balancer", path: AppRoute.LOAD_BALANCER, icon: "⚖️" },
      { name: "User Management", path: AppRoute.USERS, icon: "👥" },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      { name: "Database", path: AppRoute.DATABASE, icon: "🗄️" },
      { name: "Redis Cache", path: AppRoute.REDIS, icon: "📦" },
      { name: "Monitoring", path: AppRoute.MONITORING, icon: "📈" },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Logs", path: AppRoute.LOGS, icon: "📜" },
      { name: "Configuration", path: AppRoute.CONFIG, icon: "⚙️" },
      { name: "Settings", path: AppRoute.SETTINGS, icon: "⚙️" },
      { name: "Security", path: AppRoute.SECURITY, icon: "🔒" },
    ],
  },
];

const SidebarLink: React.FC<{ item: NavItem }> = ({ item }) => {
  const activeClass =
    "bg-blue-100 text-blue-700 border-r-4 border-blue-500 font-medium";
  const inactiveClass = "text-slate-700 hover:bg-blue-50 hover:text-blue-600";

  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      className={({ isActive }) =>
        `flex items-center py-2.5 px-5 text-sm transition-colors ${
          isActive ? activeClass : inactiveClass
        }`
      }
    >
      <span className="mr-3 text-lg">{item.icon}</span>
      {item.name}
    </NavLink>
  );
};

const Sidebar: React.FC = () => (
  <div className="w-64 bg-white shadow-lg h-full fixed flex flex-col">
    <div className="p-5 border-b border-slate-200">
      <h1 className="text-2xl font-bold text-blue-600">🎛️ Coturn Cluster</h1>
      <p className="text-sm text-slate-500">Management Dashboard</p>
    </div>
    <nav className="flex-1 overflow-y-auto py-4">
      {navigationGroups.map((group) => (
        <div key={group.title} className="mb-6">
          <h2 className="px-5 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {group.title}
          </h2>
          <ul>
            {group.items.map((item) => (
              <li key={item.path}>
                <SidebarLink item={item} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
    <div className="p-5 border-t border-slate-200 text-center">
      <p className="text-xs text-slate-400">© 2025 Coturn Cluster Manager</p>
    </div>
  </div>
);

export default Sidebar;
