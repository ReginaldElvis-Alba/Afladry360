import { useState, useEffect } from 'react';
import { Home, Menu, X, Thermometer, Droplets, Bell, BarChart2, Radio, Upload, Layout, BellRing, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  let navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'services', 'how-it-works', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMenuOpen(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent! We will get back to you soon.');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xl">
              <Home className="w-6 h-6" />
              <span>AFLA-DRY 360°</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {[
                { id: 'home', label: 'Home' },
                { id: 'about', label: 'About' },
                { id: 'services', label: 'Services' },
                { id: 'how-it-works', label: 'How it works' },
                { id: 'contact', label: 'Contact' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'text-emerald-600'
                      : 'text-gray-700 hover:text-emerald-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gray-700 hover:text-emerald-600"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="md:hidden bg-white border-t">
            <div className="px-4 py-3 space-y-3">
              {[
                { id: 'home', label: 'Home' },
                { id: 'about', label: 'About' },
                { id: 'services', label: 'Services' },
                { id: 'how-it-works', label: 'How it works' },
                { id: 'contact', label: 'Contact' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === item.id
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 pt-16"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Harvesting Health.
            <br />
            <span className="text-emerald-600">Aflatoxin-Free Maize</span> with Smart Drying
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Join the movement to eliminate aflatoxins with real-time data, smart tools, 
            farmer-first technology—built to keep your maize safe and your community healthy.
          </p>
          <button onClick={()=>navigate('/dashboard')} className="inline-flex items-center space-x-2 bg-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-emerald-700 transition-all transform hover:scale-105 shadow-lg">
            <span>Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">About AFLA-DRY 360°</h1>
              <h2 className="text-2xl font-semibold text-emerald-600 mb-2">Empowering Maize farmers</h2>
              <h3 className="text-xl text-gray-600 mb-6">Innovative solutions for quality assurance</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                AFLA-DRY 360° revolutionizes maize cultivation by providing farmers with a comprehensive web platform designed to enhance productivity and safety. Our interactive system enables you to register, log produce data, and receive real-time alerts about aflatoxin contamination. With features like near-infrared screening, weather monitoring, and predictive AI analytics, we ensure you stay informed and protected. Join us in safeguarding your harvest and improving quality through our blockchain-backed certification process.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
                <p className="font-bold text-amber-800 mb-2">Did you know?</p>
                <p className="text-amber-900">Aflatoxin can contaminate up to 25% of global food crops each year!</p>
              </div>
              <button
                onClick={() => scrollToSection('services')}
                className="text-emerald-600 font-semibold hover:text-emerald-700 inline-flex items-center space-x-1"
              >
                <span>See how it works</span>
                <span>↓</span>
              </button>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-xl">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">
                    <img src='/images/image.png' alt="Farmer working in field"/>
                  </div>
                  <p className="text-gray-700 font-medium">Farmer Working in Field</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Services</h1>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Thermometer className="w-12 h-12" />,
                title: 'Real-time Temperature Tracking',
                description: 'Monitor the temperature of your storage units directly from our platform to reduce aflatoxin risks.'
              },
              {
                icon: <Droplets className="w-12 h-12" />,
                title: 'Humidity & Moisture Monitoring',
                description: 'Get up-to-date readings of humidity and grain moisture to maintain safe drying and storage levels.'
              },
              {
                icon: <Bell className="w-12 h-12" />,
                title: 'Smart Alerts & Notifications',
                description: 'Receive automated alerts when environmental conditions approach aflatoxin danger thresholds.'
              },
              {
                icon: <BarChart2 className="w-12 h-12" />,
                title: 'Insightful Dashboards',
                description: 'Visualize your farm data using intuitive graphs and make informed decisions for quality control.'
              }
            ].map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-1 duration-300"
              >
                <div className="text-emerald-600 mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">How It Works</h1>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Radio className="w-12 h-12" />,
                title: '1. Data Collection',
                description: 'Our smart sensors monitor temperature, humidity, and moisture in your storage unit.'
              },
              {
                icon: <Upload className="w-12 h-12" />,
                title: '2. Secure Upload',
                description: 'Data is securely sent to the cloud and processed in real-time for analysis.'
              },
              {
                icon: <Layout className="w-12 h-12" />,
                title: '3. Dashboard Access',
                description: 'Farmers log in to view their personalized dashboard and receive actionable insights.'
              },
              {
                icon: <BellRing className="w-12 h-12" />,
                title: '4. Smart Alerts',
                description: 'Notifications are sent when thresholds are crossed to prevent aflatoxin contamination.'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">Contact Us</h1>
          <div className="grid md:grid-cols-2 gap-12">
            <div onSubmit={handleSubmit} className="space-y-6">
              <input
                type="text"
                placeholder="Your Name"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
              <input
                type="email"
                placeholder="Your Email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
              <textarea
                placeholder="Your Message"
                required
                rows="5"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
              ></textarea>
              <button
                onClick={handleSubmit}
                className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Send Message
              </button>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Reach Us At</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-6 h-6 text-emerald-600" />
                  <span className="text-gray-700">support@afla-dry360.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-emerald-600" />
                  <span className="text-gray-700">+254 712 345 678</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                  <span className="text-gray-700">Nairobi, Kenya</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-2">&copy; 2025 AFLA-DRY 360°. All rights reserved.</p>
          <p className="text-gray-400">Designed with ❤️ for safe harvests in Kenya.</p>
        </div>
      </footer>
    </div>
  );
}