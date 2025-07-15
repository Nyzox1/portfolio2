import React, { useState } from 'react';
import { ExternalLink, Github, Sparkles, Code, Palette, Zap, Smartphone, Brain, Filter } from 'lucide-react';

const Projects = () => {
  const [filter, setFilter] = useState('all');

  const projects = [
    {
      id: 1,
      title: 'E-commerce Platform',
      description: 'A complete e-commerce platform with integrated payments, inventory management, and a modern admin dashboard.',
      image: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=800',
      tags: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
      category: 'fullstack',
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com',
      featured: true
    },
    {
      id: 2,
      title: 'Design System',
      description: 'A full design system with reusable components and interactive documentation for teams.',
      image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800',
      tags: ['React', 'TypeScript', 'Storybook', 'Figma'],
      category: 'design',
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com',
      featured: false
    },
    {
      id: 3,
      title: 'GraphQL REST API',
      description: 'A modern API using GraphQL, JWT authentication, and auto-generated documentation for developers.',
      image: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=800',
      tags: ['GraphQL', 'Node.js', 'MongoDB', 'Apollo'],
      category: 'backend',
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com',
      featured: true
    },
    {
      id: 4,
      title: 'Flutter Mobile App',
      description: 'Cross-platform mobile app with cloud sync and real-time push notifications.',
      image: 'https://images.pexels.com/photos/147413/twitter-facebook-together-exchange-of-information-147413.jpeg?auto=compress&cs=tinysrgb&w=800',
      tags: ['Flutter', 'Dart', 'Firebase', 'Android'],
      category: 'mobile',
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com',
      featured: false
    },
    {
      id: 5,
      title: 'Analytics Dashboard',
      description: 'Interactive dashboard with real-time data visualizations and advanced metrics.',
      image: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800',
      tags: ['React', 'D3.js', 'WebSocket', 'Python'],
      category: 'frontend',
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com',
      featured: true
    },
    {
      id: 6,
      title: 'AI Chatbot',
      description: 'Intelligent chatbot with natural language processing and advanced machine learning.',
      image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
      tags: ['Python', 'OpenAI', 'FastAPI', 'Docker'],
      category: 'ai',
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com',
      featured: false
    }
  ];

  const filters = [
    { key: 'all', label: 'All', icon: Filter },
    { key: 'fullstack', label: 'Full-Stack', icon: Code },
    { key: 'frontend', label: 'Frontend', icon: Palette },
    { key: 'backend', label: 'Backend', icon: Zap },
    { key: 'design', label: 'Design', icon: Palette },
    { key: 'mobile', label: 'Mobile', icon: Smartphone },
    { key: 'ai', label: 'AI', icon: Brain }
  ];

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(project => project.category === filter);

  return (
    <section id="projects" className="py-20 bg-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            My Projects
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover a selection of my recent work and passion projects that showcase my technical skills.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {filters.map((filterItem) => (
            <button
              key={filterItem.key}
              onClick={() => setFilter(filterItem.key)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 ${
                filter === filterItem.key
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 backdrop-blur-sm border border-white/10'
              }`}
            >
              <filterItem.icon className="w-4 h-4" />
              <span className="font-medium">{filterItem.label}</span>
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className={`group relative bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:border-white/20 ${
                project.featured ? 'ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20' : ''
              }`}
            >
              {project.featured && (
                <div className="absolute top-4 left-4 z-20">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium py-1 px-3 rounded-full flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Featured</span>
                  </div>
                </div>
              )}
              
              <div className="relative overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end">
                  <div className="p-4 w-full">
                    <div className="flex space-x-3">
                      <a 
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-all duration-300 transform hover:scale-110"
                      >
                        <ExternalLink className="w-4 h-4 text-white" />
                      </a>
                      <a 
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-all duration-300 transform hover:scale-110"
                      >
                        <Github className="w-4 h-4 text-white" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors duration-300">
                  {project.title}
                </h3>
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                  {project.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-xs font-medium border border-white/10 hover:bg-white/20 transition-colors duration-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-300 mb-6 text-lg">Want to see more projects?</p>
          <a 
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105"
          >
            <Github className="w-5 h-5" />
            <span>Visit my GitHub</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Projects;
