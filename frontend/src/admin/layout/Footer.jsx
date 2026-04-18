import React from "react";

const Footer = ({ border = false }) => {
  return (
    <footer
      className={`bg-blue-800 text-white py-6 ${border ? "border-t border-blue-700" : ""}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Company Info */}
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-bold">Pysimverse</h3>
          </div>

          {/* Links */}
          <div className="flex space-x-6">
            <a
              href="/terms"
              className="text-sm text-white hover:opacity-90 transition"
            >
              Terms of Service
            </a>
            <a
              href="/terms"
              className="text-sm text-white hover:opacity-90 transition"
            >
              Privacy Policy
            </a>
            <a
              href="mailto:pysimverse@computervision.zone?subject=Support Request - Pysimverse"
              className="text-sm text-white hover:opacity-90 transition"
            >
              Support
            </a>
          </div>

          {/* Copyright */}
          <div className="mt-4 md:mt-0">
            <p className="text-sm text-white">
              © {new Date().getFullYear()} Pysimverse. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
