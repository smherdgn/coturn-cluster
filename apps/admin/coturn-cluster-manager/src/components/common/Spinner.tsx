import React from "react";

const Spinner: React.FC = () => (
  <div className="flex justify-center items-center p-10">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-slate-500">Loading...</span>
  </div>
);

export default Spinner;
