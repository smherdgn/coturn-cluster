import React from "react";

interface Props {
  title: string;
  subtitle: string;
  icon?: string;
}

const PageHeader: React.FC<Props> = ({ title, subtitle, icon }) => (
  <div className="mb-6">
    <h1 className="text-3xl font-bold text-slate-800">
      {icon && <span className="mr-2">{icon}</span>}
      {title}
    </h1>
    <p className="mt-1 text-slate-500">{subtitle}</p>
  </div>
);

export default PageHeader;
