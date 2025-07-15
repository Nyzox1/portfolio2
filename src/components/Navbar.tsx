import React, { useState, useEffect } from 'react';
import { Menu, X, Code2, Github, Linkedin, Mail } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Projects', href: '#projects' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-purple-500/5' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Code2 className="w-5 h-5 text-white" />
              </div>
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur opacity-30 animate-pulse"></div>
          <div className="relative z-10 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-32 h-32 object-contain" />
          </div>
        </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Nyzox
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-white px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-white/10 rounded-lg backdrop-blur-sm relative group"
                >
                  {item.name}
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </a>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <a
              href="#contact"
              className="relative inline-flex items-center px-6 py-2.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105"
            >
              <span className="relative z-10">Let's work together</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white focus:outline-none focus:text-white transition-colors duration-300 p-2 rounded-lg hover:bg-white/10"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-white block px-4 py-3 text-base font-medium transition-all duration-300 hover:bg-white/10 rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="pt-4 border-t border-white/10 mt-4">
              <a
                href="#contact"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white block px-4 py-3 text-base font-medium rounded-lg text-center shadow-lg"
                onClick={() => setIsOpen(false)}
              >
                Let's work together
              </a>
            </div>
            
            {/* Social Links in Mobile */}
            <div className="flex justify-center space-x-6 pt-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-300"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-300"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:admin@nyzox.tech"
                className="text-gray-400 hover:text-white transition-colors duration-300"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
