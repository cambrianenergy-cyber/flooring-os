import React from "react";

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  width?: string;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open,
  onClose,
  title,
  children,
  width = "max-w-md",
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-30">
      <div
        className={`w-full ${width} bg-white shadow-xl h-full p-6 overflow-y-auto relative`}
      >
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          <span className="text-xl">&times;</span>
        </button>
        {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
};

export default DetailDrawer;
