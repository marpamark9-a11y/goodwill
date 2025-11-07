import React from 'react'
import Header from '../components/Header'
import TopFacilities from '../components/TopFacilities'
import Banner from '../components/Banner'
import CategoryMenu from '../components/CategoryMenu'

const Home = () => {
  return (
    <div>
      <Header />
      <CategoryMenu />
      <TopFacilities />
      <Banner />
    </div>
  )
}

export default Home