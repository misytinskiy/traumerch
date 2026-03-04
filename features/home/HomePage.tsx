import HomeHero from "./HomeHero";
import Gallery from "../../components/Gallery/Gallery";
import FAQ from "../../components/FAQ/FAQ";
import Services from "../../components/Services/Services";
import ResponsiveOurPromises from "../../components/OurPromises/ResponsiveOurPromises";
import styles from "./home.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <main>
        <HomeHero />

        <div id="gallery">
          <Gallery />
        </div>

        {/* <div id="products">
          <Products />
        </div> */}

        <div id="services">
          <Services />
        </div>

        <div id="promises">
          <ResponsiveOurPromises />
        </div>

        <div id="faq">
          <FAQ />
        </div>

      </main>
    </div>
  );
}
