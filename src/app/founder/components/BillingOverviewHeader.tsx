import React from "react";

const BillingOverviewHeader: React.FC = () => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
    <h1 className="text-2xl font-bold">Billing Monitor</h1>
    <div className="text-gray-500 mt-2 md:mt-0">
      Monitor and resolve workspace billing issues
    </div>
  </div>
);

export default BillingOverviewHeader;
