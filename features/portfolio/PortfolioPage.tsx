import MediaImage from "../../components/Media/MediaImage";
import styles from "./portfolio.module.css";

const cards = [
  {
    slot: "portfolio.1",
    alt: "TrauMerch socks",
  },
  {
    slot: "portfolio.2",
    alt: "TrauMerch sweatshirt",
  },
  {
    slot: "portfolio.3",
    alt: "TrauMerch slides",
  },
  {
    slot: "portfolio.4",
    alt: "TrauMerch bucket hat",
  },
  {
    slot: "portfolio.5",
    alt: "TrauMerch cooler",
  },
  {
    slot: "portfolio.6",
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
              <article key={card.slot} className={styles.card}>
                <div className={styles.cardImageWrap}>
                  <MediaImage
                    slot={card.slot}
                    alt={card.alt}
                    fill
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
