"use client"

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Menu, X, Code2 } from "lucide-react"

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <div className="flex justify-center w-full py-6 px-4 fixed top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full shadow-lg w-full max-w-4xl relative z-10">
        <div className="flex items-center">
          <motion.div
            className="flex items-center space-x-3"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Code2 className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur opacity-30 animate-pulse"></div>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Nyzox
            </span>
          </motion.div>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {[
            { name: "Home", href: "#home" },
            { name: "About", href: "#about" },
            { name: "Projects", href: "#projects" },
            { name: "Contact", href: "#contact" }
          ].map((item) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <a 
                href={item.href} 
                className="text-sm text-gray-300 hover:text-white transition-colors font-medium relative group"
              >
                {item.name}
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </a>
            </motion.div>
          ))}
        </nav>

        {/* Desktop CTA Button */}
        <motion.div
          className="hidden md:block"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
        >
          <a
            href="#contact"
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
          >
            Let's work together
          </a>
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button 
          className="md:hidden flex items-center p-2 rounded-lg hover:bg-white/10 transition-colors" 
          onClick={toggleMenu} 
          whileTap={{ scale: 0.9 }}
        >
          <Menu className="h-6 w-6 text-gray-300" />
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 pt-24 px-6 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-6 w-6 text-gray-300" />
            </motion.button>
            <div className="flex flex-col space-y-6">
              {[
                { name: "Home", href: "#home" },
                { name: "About", href: "#about" },
                { name: "Projects", href: "#projects" },
                { name: "Contact", href: "#contact" }
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <a 
                    href={item.href} 
                    className="text-base text-gray-300 hover:text-white font-medium transition-colors" 
                    onClick={toggleMenu}
                  >
                    {item.name}
                  </a>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-6"
              >
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center w-full px-6 py-3 text-base text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg"
                  onClick={toggleMenu}
                >
                  Let's work together
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { Navbar1 }
