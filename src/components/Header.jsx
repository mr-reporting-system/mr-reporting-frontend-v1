import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo1.png";

function Header() {
  const [open, setOpen] = useState(false);
  const [showModules, setShowModules] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* LOGO */}
          <div className="flex items-center">
  <img
    src={logo}
    alt="MR Reporting Logo"
    className="h-10 w-auto object-contain"
  />
</div>


          {/* ================= DESKTOP NAV ================= */}
          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-700">

            <Link 
  to="/" 
  className="hover:text-blue-700 transition"
>
  Home
</Link>

          {/* SERVICES */}
<div
  className="relative"
  onMouseEnter={() => setShowModules(true)}
  onMouseLeave={() => setShowModules(false)}
>
  <Link 
    to="/Services"
    className="flex items-center gap-1 hover:text-blue-700 transition"
  >
    Services <ArrowIcon />
  </Link>

  {showModules && (
    <DropdownCard
      items={[
        { title: "Implementation", desc: "System setup & deployment" },
        { title: "Customization", desc: "Workflow & report configuration" },
        { title: "Integration", desc: "ERP, CRM & API connectivity" },
        { title: "Training", desc: "Onboarding & live assistance" },
        { title: "Support", desc: "24/7 technical help & updates" },
      ]}
    />
  )}
</div>

           {/* ABOUT */}
<div
  className="relative"
  onMouseEnter={() => setShowAbout(true)}
  onMouseLeave={() => setShowAbout(false)}
>
  <Link
    to="/about"
    className="flex items-center gap-1 hover:text-blue-700 transition"
  >
    About <ArrowIcon />
  </Link>

  {showAbout && (
    <DropdownCard
      items={[
        {
          title: "Our Mission",
          desc: "Purpose behind MR Reporting",
        },
        {
          title: "Our Vision",
          desc: "Future of pharma automation",
        },
        {
          title: "Client Testimonials",
          desc: "What our clients say",
        },
      ]}
    />
  )}
</div>

            <Link to="/Contact" className="hover:text-blue-700 transition">
  Contact Us
</Link>

          </nav>

          {/* RIGHT ACTIONS */}
          <div className="hidden md:flex items-center gap-6">
          
            <Link
              to="/login"
              className="bg-blue-600 text-white px-6 py-2 rounded-full
                         text-sm font-semibold hover:bg-blue-700 transition"
            >
              Log in
            </Link>
          </div>

          {/* MOBILE MENU ICON */}
          <button
            className="md:hidden text-2xl text-blue-700"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
        </div>
      </header>

      {/* ================= MOBILE MENU ================= */}
{open && (
  <>
    {/* Overlay */}
    <div
      className="fixed inset-0 bg-black/40 z-40"
      onClick={() => setOpen(false)}
    />

    {/* Sidebar */}
    <aside className="fixed top-0 right-0 h-full w-80 bg-white z-50 shadow-xl transition-transform duration-300">

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-5 border-b">
        <h2 className="font-bold text-blue-700 text-lg">
          MR Reporting
        </h2>
        <button
          onClick={() => setOpen(false)}
          className="text-xl"
        >
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col px-6 py-6 gap-5 text-gray-700">

        {[
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: "About", path: "/about" },
          { name: "Contact Us", path: "/contact" },
        ].map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => setOpen(false)}
            className="pb-3 border-b text-sm font-medium
                       hover:text-blue-600 transition"
          >
            {item.name}
          </Link>
        ))}

        {/* Login Button */}
        <Link
          to="/login"
          onClick={() => setOpen(false)}
          className="mt-6 text-center py-3 rounded-full
                     bg-blue-600 text-white font-semibold
                     shadow-md hover:shadow-lg hover:bg-blue-700
                     transition duration-300"
        >
          Log in
        </Link>

      </nav>
    </aside>
  </>
)}
    </>
  );
}

/* ================= DROPDOWN CARD ================= */
function DropdownCard({ items }) {
  return (
    <div
      className="absolute left-1/2 top-full -translate-x-1/2 mt-1
                 w-[280px] bg-white rounded-xl shadow-xl
                 border border-blue-100 p-4
                 z-[9999] pointer-events-auto"
    >
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex gap-3 p-3 rounded-lg
                       cursor-pointer hover:bg-blue-50 transition"
          >
            <ArrowBold />
            <div>
              <p className="font-semibold text-blue-700">
                {item.title}
              </p>
              <p className="text-xs text-gray-500">
                {item.desc}
              </p>
            </div>
          </div>
        ))}

        <div className="border-t pt-3 mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">Follow us</span>
          <div className="flex gap-4 text-blue-600">
            <SocialInstagram />
            <SocialX />
            <SocialLinkedIn />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= ICONS ================= */
function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ArrowBold() {
  return (
    <svg className="w-4 h-4 mt-1 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function SocialInstagram() {
  return (
    <svg className="w-5 h-4 cursor-pointer hover:text-blue-800" fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
    </svg>
  );
}

function SocialX() {
  return (
    <svg className="w-5 h-4 cursor-pointer hover:text-blue-800" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.2 2H21l-6.5 7.4L22 22h-6.2l-4.8-6.1L5.4 22H2.6l6.9-7.9L2 2h6.3l4.3 5.6L18.2 2z"/>
    </svg>
  );
}

function SocialLinkedIn() {
  return (
    <svg className="w-5 h-4 cursor-pointer hover:text-blue-800" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 8.98h4v12H3zM9 8.98h3.8v1.6h.1a4.2 4.2 0 0 1 3.8-2.1c4 0 4.7 2.6 4.7 6v6.5h-4v-5.8c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3v5.9H9z"/>
    </svg>
  );
}

export default Header;
