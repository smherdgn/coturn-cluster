import React from "react";
import PageHeader from "../components/layout/PageHeader";
import Spinner from "../components/common/Spinner";
import Card from "../components/common/Card";
import StatusBadge from "../components/common/StatusBadge";
import { useSecurityStatus } from "../hooks/apiHooks";

const SecurityPage: React.FC = () => {
  const {
    data: securityStatus,
    isLoading,
    isError,
    error,
  } = useSecurityStatus();

  if (isLoading) return <Spinner />;
  if (isError) return <p className="text-red-500">Error: {error.message}</p>;

  const { sslCertificates, firewall } = securityStatus || {};

  return (
    <>
      <PageHeader
        title="Security Management"
        subtitle="SSL certificates, firewall, and security monitoring"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="SSL Certificates">
          {sslCertificates?.map((cert) => (
            <div
              key={cert.domain}
              className="flex justify-between items-center py-2 border-b last:border-b-0"
            >
              <span className="text-sm  text-slate-500">{cert.domain}</span>
              <div>
                <span className="text-sm font-medium mr-2">
                  {cert.expiresIn}
                </span>
                <StatusBadge status={cert.status} />
              </div>
            </div>
          ))}
        </Card>
        <Card title="Firewall">
          <div className="flex justify-between py-2">
            <span className="text-sm  text-slate-500">Status</span>
            <StatusBadge status={firewall?.status} />
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm  text-slate-500">Active Rules</span>
            <span className="font-medium  text-slate-500">
              {firewall?.rules}
            </span>
          </div>
        </Card>
        {/* Authentication ve Encryption kartları */}
      </div>
    </>
  );
};

export default SecurityPage;
