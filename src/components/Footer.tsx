import React from 'react';
import { Github, Linkedin, Mail, Heart, ArrowUp, Code2 } from 'lucide-react';
import { FaDiscord } from 'react-icons/fa';


const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 border-t border-white/10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur opacity-30"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                nyzox.tech
              </span>
            </div>
            <p className="text-gray-300 max-w-md leading-relaxed">
              Passionate full-stack developer crafting exceptional digital experiences 
              with great attention to detail and performance. Always ready for new challenges.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-lg">Navigation</h3>
            <ul className="space-y-3">
              {[
                { name: 'Home', href: '#home' },
                { name: 'About', href: '#about' },
                { name: 'Projects', href: '#projects' },
                { name: 'Contact', href: '#contact' }
              ].map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href}
                    className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-lg">Contact</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="mailto:contact@nyzox.tech"
                  className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block"
                >
                  contact@nyzox.tech
                </a>
              </li>
              <li>
                <a 
                  href="https://discord.gg/eszMX9jg" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block"
                >
                  Discord Server
                </a>
              </li>
              <li>
                <span className="text-gray-300">Paris, France</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 text-gray-300 mb-6 md:mb-0">
            <span>© 2025 Nyzox. Made with</span>
            <Heart className="w-4 h-4 text-red-500 animate-pulse" />
            <span>in Belgium</span>
          </div>

          <div className="flex items-center space-x-6">
            {/* Social Links */}
            <div className="flex space-x-4">
              {[
                { icon: Github, href: 'https://github.com/nyzox1', label: 'GitHub' },
                { icon: FaDiscord, href: 'https://discord.com/users/1055869215036424303', label: 'Discord' },
                { icon: Mail, href: 'mailto:contact@nyzox.tech', label: 'Email' }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110 p-2 rounded-lg hover:bg-white/10"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            {/* Scroll to Top */}
            <button
              onClick={scrollToTop}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-purple-500/25"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
