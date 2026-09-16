 "use client";

import MediaImage from "../../components/Media/MediaImage";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./inspiration.module.css";

export default function InspirationPage() {
  const { t } = useLanguage();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.header}>
          <h1 className={styles.headerTitle}>
            {t.inspiration.titleLine1}
            <br />
            {t.inspiration.titleLine2}
          </h1>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.grid}>
            <article className={styles.cardOne}>
              <MediaImage
                slot="inspiration.tile-01"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwo}>
              <MediaImage
                slot="inspiration.tile-02"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.textCard}>
              <p>{t.inspiration.textCardOne}</p>
            </article>

            <article className={styles.cardFour}>
              <MediaImage
                slot="inspiration.tile-04"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardThree}>
              <MediaImage
                slot="inspiration.tile-03"
                fill
                className={styles.image}
              />
            </article>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.gridSecond}>
            <article className={styles.cardFive}>
              <MediaImage
                slot="inspiration.tile-05"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardSix}>
              <MediaImage
                slot="inspiration.tile-06"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardSeven}>
              <MediaImage
                slot="inspiration.tile-07"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardEight}>
              <MediaImage
                slot="inspiration.tile-08"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardNine}>
              <MediaImage
                slot="inspiration.tile-09"
                fill
                className={styles.image}
              />
            </article>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.gridThird}>
            <article className={styles.cardTen}>
              <MediaImage
                slot="inspiration.tile-10"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardEleven}>
              <MediaImage
                slot="inspiration.tile-11"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.textCardSecond}>
              <p>{t.inspiration.textCardTwo}</p>
            </article>

            <article className={styles.cardTwelve}>
              <MediaImage
                slot="inspiration.tile-12"
                fill
                className={styles.image}
              />
            </article>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.gridFourth}>
            <article className={styles.cardThirteen}>
              <MediaImage
                slot="inspiration.tile-13"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardFourteen}>
              <MediaImage
                slot="inspiration.tile-14"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardFifteen}>
              <MediaImage
                slot="inspiration.tile-15"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardSixteen}>
              <MediaImage
                slot="inspiration.tile-16"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardSeventeen}>
              <MediaImage
                slot="inspiration.tile-17"
                fill
                className={styles.image}
              />
            </article>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.gridFifth}>
            <article className={styles.cardEighteen}>
              <MediaImage
                slot="inspiration.tile-18"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardNineteen}>
              <MediaImage
                slot="inspiration.tile-19"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwenty}>
              <MediaImage
                slot="inspiration.tile-20"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentyOne}>
              <MediaImage
                slot="inspiration.tile-21"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.textCardThird}>
              <p>{t.inspiration.textCardThree}</p>
            </article>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.gridSixth}>
            <article className={styles.cardTwentyTwo}>
              <MediaImage
                slot="inspiration.tile-22"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentyThree}>
              <MediaImage
                slot="inspiration.tile-23"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentyFour}>
              <MediaImage
                slot="inspiration.tile-24"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentyFive}>
              <MediaImage
                slot="inspiration.tile-25"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentySix}>
              <MediaImage
                slot="inspiration.tile-26"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentySeven}>
              <MediaImage
                slot="inspiration.tile-27"
                fill
                className={styles.image}
              />
            </article>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.gridSeventh}>
            <article className={styles.cardTwentyEight}>
              <MediaImage
                slot="inspiration.tile-28"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentyNine}>
              <MediaImage
                slot="inspiration.tile-29"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardThirty}>
              <MediaImage
                slot="inspiration.tile-30"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.textCardFourth}>
              <p>{t.inspiration.textCardFour}</p>
            </article>

            <article className={styles.cardThirtyOne}>
              <MediaImage
                slot="inspiration.tile-31"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardThirtyTwo}>
              <MediaImage
                slot="inspiration.tile-32"
                fill
                className={styles.image}
              />
            </article>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.gridEighth}>
            <article className={styles.cardThirtyThree}>
              <MediaImage
                slot="inspiration.tile-33"
                fill
                className={styles.image}
              />
            </article>

            <article className={styles.cardThirtyFour}>
              <MediaImage
                slot="inspiration.tile-34"
                fill
                className={styles.image}
              />
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
