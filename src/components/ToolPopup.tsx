import { useState } from "react";

const ToolPopup = ({ buttonLabel, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            {/* Button to Open Popup */}
            <a
                href="#"
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-green-800 text-white rounded-full hover:cursor-pointer"
            >
                {buttonLabel}
            </a>

            {/* Popup Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-[99999]"
                >
                    {/* Popup Box (5% less than full height) */}
                    <div
                        className="bg-white p-6 rounded shadow-lg relative w-full max-w-lg"
                        style={{ height: "85vh", overflow: "hidden",marginTop:"5%" }} // ✅ 95% of the viewport height
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                        >
                            ✖
                        </button>

                        {/* ChatBox (or any tool inside) */}
                        <div className="flex justify-center items-center h-full">
                            <div className="transform scale-90 origin-top">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToolPopup;
