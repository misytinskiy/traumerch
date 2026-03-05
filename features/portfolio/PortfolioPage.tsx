import Image from "next/image";
import styles from "./portfolio.module.css";

const cards = [
  {
    image: "/portfolio/1.png",
    alt: "TrauMerch socks",
  },
  {
    image: "/portfolio/2.png",
    alt: "TrauMerch sweatshirt",
  },
  {
    image: "/portfolio/3.png",
    alt: "TrauMerch slides",
  },
  {
    image: "/portfolio/4.png",
    alt: "TrauMerch bucket hat",
  },
  {
    image: "/portfolio/5.png",
    alt: "TrauMerch cooler",
  },
  {
    image: "/portfolio/6.png",
    alt: "TrauMerch hoodie",
  },
];

export default function PortfolioPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.title}>
            MERCH THAT BRINGS
            <br />
            VALUES TO LIFE
          </h1>
          <p className={styles.intro}>
            WE HELP COMPANIES CREATE MERCHANDISE FOR BOTH CUSTOMERS AND TEAMS,
            FROM CLIENT GIFTS AND CAMPAIGN ITEMS TO ONBOARDING KITS AND INTERNAL
            CULTURE PIECES. EVERY PRODUCT IS DESIGNED TO STRENGTHEN
            RELATIONSHIPS, REFLECT YOUR VALUES, AND MAKE YOUR BRAND FEEL
            TANGIBLE.
          </p>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.grid}>
            {cards.map((card) => (
              <article key={card.image} className={styles.card}>
                <div className={styles.cardImageWrap}>
                  <Image
                    src={card.image}
                    alt={card.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className={styles.cardImage}
                  />
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.cardLabel}>TOTAL CUSTOMISATION</span>
                  <h3 className={styles.cardTitle}>
                    NOTHING STANDARD, EVERYTHING YOURS.
                  </h3>
                  <p className={styles.cardText}>
                    We don’t work with off-the-shelf solutions. Every product is
                    adapted to your brand identity, from design details to
                    packaging. You have the freedom to request any element you
                    want — coloured drawstrings on hoodies or a leather strap on
                    caps — everything is possible.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
