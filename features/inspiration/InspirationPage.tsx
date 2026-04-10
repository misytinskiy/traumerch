 "use client";

import Image from "next/image";
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
              <Image
                src="/inspirationPage/1.png"
                alt="Branded cap with pencil"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwo}>
              <Image
                src="/inspirationPage/2.png"
                alt="Branded tag"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.textCard}>
              <p>{t.inspiration.textCardOne}</p>
            </article>

            <article className={styles.cardFour}>
              <Image
                src="/inspirationPage/4.png"
                alt="Earbuds case"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardThree}>
              <Image
                src="/inspirationPage/3.png"
                alt="Branded brush"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.gridSecond}>
            <article className={styles.cardFive}>
              <Image
                src="/inspirationPage/5.png"
                alt="Inspiration photo 5"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardSix}>
              <Image
                src="/inspirationPage/6.png"
                alt="Inspiration photo 6"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardSeven}>
              <Image
                src="/inspirationPage/7.png"
                alt="Inspiration photo 7"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardEight}>
              <Image
                src="/inspirationPage/8.png"
                alt="Inspiration photo 8"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardNine}>
              <Image
                src="/inspirationPage/9.png"
                alt="Inspiration photo 9"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.gridThird}>
            <article className={styles.cardTen}>
              <Image
                src="/inspirationPage/10.png"
                alt="Inspiration photo 10"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardEleven}>
              <Image
                src="/inspirationPage/11.png"
                alt="Inspiration photo 11"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.textCardSecond}>
              <p>{t.inspiration.textCardTwo}</p>
            </article>

            <article className={styles.cardTwelve}>
              <Image
                src="/inspirationPage/12.png"
                alt="Inspiration photo 12"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.gridFourth}>
            <article className={styles.cardThirteen}>
              <Image
                src="/inspirationPage/13.png"
                alt="Inspiration photo 13"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardFourteen}>
              <Image
                src="/inspirationPage/14.png"
                alt="Inspiration photo 14"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardFifteen}>
              <Image
                src="/inspirationPage/15.png"
                alt="Inspiration photo 15"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardSixteen}>
              <Image
                src="/inspirationPage/16.png"
                alt="Inspiration photo 16"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardSeventeen}>
              <Image
                src="/inspirationPage/17.png"
                alt="Inspiration photo 17"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.gridFifth}>
            <article className={styles.cardEighteen}>
              <Image
                src="/inspirationPage/18.png"
                alt="Inspiration photo 18"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardNineteen}>
              <Image
                src="/inspirationPage/19.png"
                alt="Inspiration photo 19"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwenty}>
              <Image
                src="/inspirationPage/20.png"
                alt="Inspiration photo 20"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentyOne}>
              <Image
                src="/inspirationPage/21.png"
                alt="Inspiration photo 21"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                quality={100}
                unoptimized
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
              <Image
                src="/inspirationPage/22.png"
                alt="Inspiration photo 22"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentyThree}>
              <Image
                src="/inspirationPage/23.png"
                alt="Inspiration photo 23"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentyFour}>
              <Image
                src="/inspirationPage/24.png"
                alt="Inspiration photo 24"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentyFive}>
              <Image
                src="/inspirationPage/25.png"
                alt="Inspiration photo 25"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentySix}>
              <Image
                src="/inspirationPage/26.png"
                alt="Inspiration photo 26"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentySeven}>
              <Image
                src="/inspirationPage/27.png"
                alt="Inspiration photo 27"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.gridSeventh}>
            <article className={styles.cardTwentyEight}>
              <Image
                src="/inspirationPage/28.png"
                alt="Inspiration photo 28"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardTwentyNine}>
              <Image
                src="/inspirationPage/29.png"
                alt="Inspiration photo 29"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardThirty}>
              <Image
                src="/inspirationPage/30.png"
                alt="Inspiration photo 30"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.textCardFourth}>
              <p>{t.inspiration.textCardFour}</p>
            </article>

            <article className={styles.cardThirtyOne}>
              <Image
                src="/inspirationPage/31.png"
                alt="Inspiration photo 31"
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardThirtyTwo}>
              <Image
                src="/inspirationPage/32.png"
                alt="Inspiration photo 32"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>
          </div>
        </section>

        <section className={styles.gridSection}>
          <div className={styles.gridEighth}>
            <article className={styles.cardThirtyThree}>
              <Image
                src="/inspirationPage/33.png"
                alt="Inspiration photo 33"
                fill
                sizes="(max-width: 900px) 100vw, 25vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>

            <article className={styles.cardThirtyFour}>
              <Image
                src="/inspirationPage/34.png"
                alt="Inspiration photo 34"
                fill
                sizes="(max-width: 900px) 100vw, 75vw"
                quality={100}
                unoptimized
                className={styles.image}
              />
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
