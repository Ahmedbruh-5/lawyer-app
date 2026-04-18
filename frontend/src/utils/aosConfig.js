// AOS Configuration to prevent language file loading issues
import AOS from 'aos';
import 'aos/dist/aos.css';

// Initialize AOS with safe configuration
export const initAOS = () => {
  try {
    AOS.init({
      once: true,
      disable: "phone",
      duration: 700,
      easing: "ease-out-cubic",
      useClassNames: false,
    });
  } catch (error) {
    console.warn('AOS initialization failed:', error);
  }
};

export default AOS;




