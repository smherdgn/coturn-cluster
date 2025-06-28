import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";

const SettingCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  to: string;
}> = ({ icon, title, description, to }) => (
  <Link
    to={to}
    className="block p-5 bg-white rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
  >
    <div className="flex items-center space-x-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
    </div>
  </Link>
);

const SettingsPage: React.FC = () => {
  return (
    <>
      <PageHeader
        title="⚙️ System Settings"
        subtitle="Manage and configure all aspects of the Coturn Cluster."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SettingCard
          icon="🔧"
          title="General Configuration"
          description="Manage cluster-wide settings like log levels and TURN realms."
          to="/config"
        />
        <SettingCard
          icon="👥"
          title="User Management"
          description="Add, remove, and manage TURN/STUN authentication users."
          to="/users"
        />
        <SettingCard
          icon="🔒"
          title="Security"
          description="View and manage SSL certificates, firewall, and encryption."
          to="/security"
        />
        <SettingCard
          icon="⚖️"
          title="Load Balancer"
          description="Monitor and configure the Nginx load balancer."
          to="/load-balancer"
        />
        <SettingCard
          icon="🗄️"
          title="Database"
          description="Check the health and status of the PostgreSQL database."
          to="/database"
        />
        <SettingCard
          icon="📦"
          title="Redis Cache"
          description="Monitor the performance and health of the Redis cache."
          to="/redis"
        />
      </div>
    </>
  );
};

export default SettingsPage;
