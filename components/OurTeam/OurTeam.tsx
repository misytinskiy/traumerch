"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import styles from "./OurTeam.module.css";

type TeamMember = {
  name: string;
  role: string;
  image?: string;
  imageAlt?: string;
};

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M7 10v7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 17v-4.2c0-1.3.9-2.3 2.2-2.3 1.3 0 2 1 2 2.3V17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 7.2a.7.7 0 1 1 0 1.4.7.7 0 0 1 0-1.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect
        x="4.8"
        y="7"
        width="14.4"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M6 8.4 12 12.9l6-4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const socialIcons = [
  { key: "linkedin", label: "LinkedIn", icon: <LinkedinIcon /> },
  { key: "email", label: "Email", icon: <MailIcon /> },
];

const linkedinUrl = "https://www.linkedin.com/company/traumerch/";

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d={direction === "left" ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function OurTeam() {
  const { t } = useLanguage();
  const members = t.ourTeam.members as TeamMember[];
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const element = gridRef.current;
    if (!element) return;

    const updateScrollState = () => {
      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      setCanScrollLeft(element.scrollLeft > 4);
      setCanScrollRight(element.scrollLeft < maxScrollLeft - 4);
    };

    updateScrollState();
    element.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      element.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [members.length]);

  const scrollCards = (direction: "left" | "right") => {
    const element = gridRef.current;
    if (!element) return;

    const amount = Math.max(element.clientWidth * 0.6, 280);
    element.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className={styles.section} aria-labelledby="our-team-title">
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t.ourTeam.eyebrow}</p>
        <SectionTitle className={styles.title}>{t.ourTeam.title}</SectionTitle>
      </div>

      <div className={styles.carousel}>
        <button
          type="button"
          className={`${styles.arrowButton} ${styles.arrowLeft}`}
          aria-label="Scroll team left"
          disabled={!canScrollLeft}
          onClick={() => scrollCards("left")}
        >
          <ArrowIcon direction="left" />
        </button>

        <div ref={gridRef} className={styles.grid}>
          {members.map((member) => (
            <article key={member.name} className={styles.card}>
              {member.image ? (
                <Image
                  src={member.image}
                  alt={member.imageAlt ?? member.name}
                  fill
                  sizes="(max-width: 480px) 88vw, (max-width: 900px) calc(100vw - 58px), (max-width: 1280px) 44vw, 24vw"
                  className={styles.image}
                />
              ) : null}

              <div className={styles.content}>
                <div className={styles.headingBlock}>
                  <p className={styles.role}>{member.role}</p>
                  <h3 className={styles.name}>{member.name}</h3>
                </div>

                <div className={styles.socials} aria-label={t.ourTeam.socialLabel}>
                  {socialIcons.map((social) => {
                    const href =
                      social.key === "linkedin"
                        ? linkedinUrl
                        : `mailto:${
                            member.name === "Yury"
                              ? "operations@traumerch.com"
                              : "sales@traumerch.com"
                          }`;

                    return (
                      <a
                      key={`${member.name}-${social.key}`}
                      href={href}
                      className={styles.socialButton}
                      target={social.key === "linkedin" ? "_blank" : undefined}
                      rel={
                        social.key === "linkedin" ? "noreferrer noopener" : undefined
                      }
                      aria-label={`${member.name} ${social.label}`}
                      title={`${member.name} ${social.label}`}
                    >
                      {social.icon}
                      </a>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          className={`${styles.arrowButton} ${styles.arrowRight}`}
          aria-label="Scroll team right"
          disabled={!canScrollRight}
          onClick={() => scrollCards("right")}
        >
          <ArrowIcon direction="right" />
        </button>

        <div className={styles.bottomArrows}>
          <button
            type="button"
            className={styles.bottomArrowButton}
            aria-label="Scroll team left"
            disabled={!canScrollLeft}
            onClick={() => scrollCards("left")}
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            className={styles.bottomArrowButton}
            aria-label="Scroll team right"
            disabled={!canScrollRight}
            onClick={() => scrollCards("right")}
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>
    </section>
  );
}
