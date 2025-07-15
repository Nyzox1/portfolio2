import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send, CheckCircle, MessageSquare, User, AtSign } from 'lucide-react';
import { FaDiscord } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Envoyer le message à la base de données
      const { error } = await supabase
        .from('contact_messages')
        .insert([{
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          status: 'unread'
        }]);

      if (error) throw error;

      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setIsSubmitting(false);
      // Optionnel: afficher un message d'erreur
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      content: 'admin@nyzox.tech',
      link: 'mailto:admin@nyzox.tech',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: FaDiscord,
      title: 'Discord',
      content: 'stonyzox',
      link: 'https://discord.com/users/1055869215036424303',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: MapPin,
      title: 'Location',
      content: 'Paris, France',
      link: '#',
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  return (
    <section id="contact" className="py-20 bg-slate-900/50 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Contact Me
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Got a project idea? A question? Feel free to reach out! I'd be happy to chat with you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-3xl font-semibold text-white mb-6 flex items-center">
                <MessageSquare className="w-8 h-8 text-purple-400 mr-3" />
                Let's talk about your project
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                I’m always open to new opportunities and interesting projects.
                Whether you need help developing an app, creating a website, or
                simply want to discuss an idea, I’d be glad to connect with you.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <a
                  key={index}
                  href={info.link}
                  className="group flex items-center space-x-4 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-white/20"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${info.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <info.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-lg">{info.title}</h4>
                    <p className="text-gray-300">{info.content}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300">
            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Message sent!</h3>
                <p className="text-gray-300 text-lg">
                  Thank you for your message. I will get back to you as soon as possible.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <AtSign className="w-4 h-4 mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 rounded-lg font-semibold hover:from-purple-500 hover:to-violet-500 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
