import React from 'react';
import { HeroGeometric } from './ui/hero-geometric';

const Hero = () => {
  return (
    <section id="home" className="pt-20">
      <HeroGeometric 
        badge="Just an owner of my own shit."
        title1="Nyzox"
        title2="Full-Stack & UI/UX Designer"
      />
    </section>
  );
};

export default Hero;