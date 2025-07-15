import React from 'react';
import { Code, Palette, Rocket, Users, Award, Coffee, Star, Zap } from 'lucide-react';

const About = () => {
  const stats = [
    { icon: Code, label: 'Projects completed', value: '50+', color: 'from-purple-500 to-violet-500' },
    { icon: Users, label: 'Happy clients', value: '30+', color: 'from-pink-500 to-rose-500' },
    { icon: Award, label: 'Years of experience', value: '5+', color: 'from-blue-500 to-cyan-500' },
    { icon: Coffee, label: 'Coffees consumed', value: '∞', color: 'from-orange-500 to-yellow-500' },
  ];

  const skills = [
    { name: 'Frontend Development', level: 95, color: 'from-blue-500 to-cyan-500', icon: Code },
    { name: 'Backend Development', level: 88, color: 'from-green-500 to-emerald-500', icon: Zap },
    { name: 'UI/UX Design', level: 90, color: 'from-purple-500 to-pink-500', icon: Palette },
    { name: 'DevOps & Cloud', level: 80, color: 'from-orange-500 to-red-500', icon: Rocket },
  ];

  const technologies = [
    { name: 'React', category: 'Frontend' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Python', category: 'Language' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'MongoDB', category: 'Database' },
    { name: 'AWS', category: 'Cloud' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'Next.js', category: 'Framework' },
    { name: 'Tailwind CSS', category: 'Styling' },
    { name: 'Figma', category: 'Design' },
    { name: 'Git', category: 'Tools' }
  ];

  return (
    <section id="about" className="py-20 bg-slate-900/50 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About me
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Passionate developer with over 5 years of experience creating modern web applications and exceptional user experiences.
          </p>
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left side - Content */}
          <div className="space-y-8">
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                Hi! I'm Nyzox, a full-stack developer passionate about crafting exceptional digital experiences.
                My journey began 5 years ago with a simple curiosity for coding, and since then, I've had the
                opportunity to work on various challenging and exciting projects.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                I combine technical expertise with an artistic mindset to build solutions that are not only
                functional but also beautiful and intuitive. I love taking on new challenges and constantly
                learning new technologies.
              </p>
            </div>

            {/* Skills Progress */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <Star className="w-6 h-6 text-purple-400 mr-2" />
                Skills
              </h3>
              {skills.map((skill, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <skill.icon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300 font-medium">{skill.name}</span>
                    </div>
                    <span className="text-gray-400 font-mono">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full bg-gradient-to-r ${skill.color} transform transition-all duration-1000 ease-out relative`}
                      style={{ width: `${skill.level}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Stats */}
          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="group relative">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-white/20">
                  <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-300 text-sm font-medium">{stat.label}</div>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Technologies */}
        <div className="mt-20">
          <h3 className="text-3xl font-semibold text-white text-center mb-12 flex items-center justify-center">
            <Zap className="w-8 h-8 text-purple-400 mr-3" />
            Technologies I use
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {technologies.map((tech, index) => (
              <div key={index} className="group relative">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-purple-500/30">
                  <div className="text-white font-medium mb-1">{tech.name}</div>
                  <div className="text-xs text-gray-400">{tech.category}</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
