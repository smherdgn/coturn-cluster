import React from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
}

const Card: React.FC<Props> = ({ title, children, className, ...props }) => (
  <div className={`bg-white shadow-md rounded-lg p-5 ${className}`} {...props}>
    {title && (
      <h2 className="text-lg font-semibold text-slate-700 mb-3">{title}</h2>
    )}
    {children}
  </div>
);

export default Card;
