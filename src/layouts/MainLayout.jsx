import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';

const MainLayout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background font-sans">
            <Header />
            <main className="flex-1 pb-20 lg:pb-0">
                <Outlet />
            </main>
            <Footer />
            <BottomNav />
        </div>
    );
};

export default MainLayout;
