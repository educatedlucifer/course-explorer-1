import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { CourseCatalog } from '@/components/CourseCatalog';
import { CourseViewer } from '@/components/CourseViewer';
import { Features } from '@/components/Features';
import { Testimonials } from '@/components/Testimonials';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <CourseCatalog />
        <CourseViewer />
        <Features />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
