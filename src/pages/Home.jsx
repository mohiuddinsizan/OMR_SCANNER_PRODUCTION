import { useEffect } from "react";
import Hero from "../components/landing/Hero";
import ProductCarousel from "../components/landing/ProductCarousel";
import Services from "../components/landing/Services";
import Tutorials from "../components/landing/Tutorials";

export default function Home() {
  useEffect(() => {
    document.title = "Scanova — Enterprise OMR Scanner Platform";
  }, []);

  return (
    <>
      <Hero />
      <div id="pricing">
        <ProductCarousel />
      </div>
      <div id="services">
        <Services />
      </div>
      <div id="tutorials">
        <Tutorials />
      </div>
    </>
  );
}