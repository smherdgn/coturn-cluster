import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const Layout: React.FC = () => (
  <div className="flex h-screen bg-slate-100 font-sans">
    <Sidebar />
    <main className="flex-1 ml-64 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <Outlet />
    </main>
  </div>
);

export default Layout;
