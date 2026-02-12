import Hero from '@/components/Hero';
import BacktestChart from '@/components/BacktestChart';
import PerformanceChart from '@/components/PerformanceChart';
import Stats from '@/components/Stats';
import CurrentSignals from '@/components/CurrentSignals';
import HowItWorks from '@/components/HowItWorks';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <BacktestChart />
      <PerformanceChart />
      <Stats />
      <CurrentSignals />
      <HowItWorks />
      <Footer />
    </main>
  );
}
