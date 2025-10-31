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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50 p-4">
          {/* Popup Box (5% less than full height) */}
          <div
            className="relative w-full max-w-lg rounded bg-white p-6 shadow-lg"
            style={{ height: "85vh", overflow: "hidden", marginTop: "5%" }} // ✅ 95% of the viewport height
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-2 top-2 text-gray-600 hover:text-gray-800"
            >
              ✖
            </button>

            {/* ChatBox (or any tool inside) */}
            <div className="flex h-full items-center justify-center">
              <div className="origin-top scale-90 transform">{children}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolPopup;
