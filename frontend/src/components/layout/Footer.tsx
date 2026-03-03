'use client';

import { useTheme } from '@/contexts/ThemeContext';

export function Footer() {
  const { isDarkTheme } = useTheme();

  return (
    <footer className={`mt-auto ${isDarkTheme ? 'bg-[#1a1a1a]' : 'bg-bg2'} text-white`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Bora Amusement Park</h3>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Experience the thrill and excitement at Ethiopia's premier amusement park.
            </p>
          </div>
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Quick Links</h3>
            <ul className={`space-y-2 text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              <li><a href="/events" className={`hover:${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Events</a></li>
              <li><a href="/about" className={`hover:${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>About Us</a></li>
              <li><a href="/contact" className={`hover:${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Contact</h3>
            <ul className={`space-y-2 text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>Email: info@borapark.com</li>
              <li>Phone: +251 11 000 0000</li>
              <li>Addis Ababa, Ethiopia</li>
            </ul>
          </div>
        </div>
        <div className={`mt-8 pt-8 border-t text-center text-sm ${
          isDarkTheme 
            ? 'border-gray-800 text-gray-400' 
            : 'border-gray-400 text-gray-600'
        }`}>
          <p>&copy; {new Date().getFullYear()} Bora Amusement Park. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
