import { useState } from "react";

interface ToolPopupProps {
  buttonLabel: string;
  children: React.ReactNode;
}

const ToolPopup = ({ buttonLabel, children }: ToolPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Button to Open Popup */}
      <a
        href="#"
        onClick={() => setIsOpen(true)}
        className="rounded-full bg-green-800 px-4 py-2 text-white hover:cursor-pointer"
      >
        {buttonLabel}
      </a>

      {/* Popup Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          {/* Popup Box */}
          <div
            className="relative w-full max-w-3xl rounded-lg bg-white shadow-2xl"
            style={{ height: "90vh", maxHeight: "900px" }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
              aria-label="Close"
            >
              ✖
            </button>

            {/* ChatBox (or any tool inside) */}
            <div className="h-full w-full overflow-hidden rounded-lg p-4">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolPopup;
