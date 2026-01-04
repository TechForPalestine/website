import { useState } from "react";

interface ToolPopupProps {
  buttonLabel: string;
  children: React.ReactNode;
}

const ToolPopup = ({ buttonLabel, children }: ToolPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when popup is open
  const handleOpen = () => {
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  };

  const handleClose = () => {
    setIsOpen(false);
    document.body.style.overflow = "unset";
  };

  return (
    <div>
      {/* Button to Open Popup */}
      <a
        href="#"
        onClick={handleOpen}
        className="rounded-full bg-green-800 px-4 py-2 text-white hover:cursor-pointer"
      >
        {buttonLabel}
      </a>

      {/* Popup Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          {/* Popup Box */}
          <div
            className="relative w-full overflow-hidden rounded-lg shadow-2xl"
            style={{ width: "min(600px, 90vw)", height: "800px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-lg transition-colors hover:bg-white hover:text-gray-900"
              aria-label="Close"
            >
              ✖
            </button>

            {/* ChatBox (or any tool inside) */}
            <div className="h-full w-full">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolPopup;
