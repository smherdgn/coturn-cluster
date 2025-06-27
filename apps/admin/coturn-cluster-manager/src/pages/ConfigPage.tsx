import React from "react";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/common/Card";
import Button from "../components/common/Button";

const ConfigPage: React.FC = () => {
  const handleSave = () => {
    alert("Configuration saved! (Not really, this is a placeholder)");
  };

  return (
    <>
      <PageHeader
        title="Configuration"
        subtitle="Manage system-wide configurations. Changes may require service restarts."
      />
      <Card>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="log-level"
              className="block text-sm font-medium text-slate-700"
            >
              Log Level
            </label>
            <select
              id="log-level"
              className="mt-1 block w-full md:w-1/2 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              defaultValue="INFO"
            >
              <option>INFO</option>
              <option>DEBUG</option>
              <option>WARN</option>
              <option>ERROR</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="turn-realm"
              className="block text-sm font-medium text-slate-700"
            >
              TURN Realm
            </label>
            <input
              type="text"
              id="turn-realm"
              defaultValue="example.org"
              className="mt-1 block w-full md:w-1/2 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="pt-2">
            <Button onClick={handleSave}>Save Configuration</Button>
          </div>
        </div>
      </Card>
    </>
  );
};

export default ConfigPage;
