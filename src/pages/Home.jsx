import React from 'react'
import LandingNav from '../components/Home.Component/LandingNav'
import Landing from '../components/Home.Component/Landing'
import Features from '../components/Home.Component/Features'
import About from '../components/Home.Component/About'
import Testimonials from '../components/Home.Component/Testimonials'
import CTASection from '../components/Home.Component/CTASection'
import Footer from '../components/Home.Component/Footer'

const Home = () => {
  return (
    <div>
      <LandingNav />
      <Landing />
      <Features />
      <About />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  )
}

export default Home