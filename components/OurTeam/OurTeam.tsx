"use client";

import Image from "next/image";
import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import styles from "./OurTeam.module.css";

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  image?: string;
  imageAlt?: string;
  imagePending?: boolean;
};

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M6.94 8.5A1.44 1.44 0 1 0 6.94 5.62a1.44 1.44 0 0 0 0 2.88ZM5.7 9.73h2.47v8.02H5.7V9.73Zm4.01 0h2.37v1.1h.03c.33-.62 1.13-1.28 2.34-1.28 2.5 0 2.96 1.64 2.96 3.77v4.43h-2.47v-3.93c0-.94-.02-2.15-1.31-2.15-1.31 0-1.52 1.03-1.52 2.08v4h-2.4V9.73Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M7.6 3h8.8A4.6 4.6 0 0 1 21 7.6v8.8a4.6 4.6 0 0 1-4.6 4.6H7.6A4.6 4.6 0 0 1 3 16.4V7.6A4.6 4.6 0 0 1 7.6 3Zm0 1.8A2.8 2.8 0 0 0 4.8 7.6v8.8a2.8 2.8 0 0 0 2.8 2.8h8.8a2.8 2.8 0 0 0 2.8-2.8V7.6a2.8 2.8 0 0 0-2.8-2.8H7.6Zm8.95 1.35a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7.38A4.62 4.62 0 1 1 7.38 12 4.62 4.62 0 0 1 12 7.38Zm0 1.8A2.82 2.82 0 1 0 14.82 12 2.82 2.82 0 0 0 12 9.18Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect
        x="4.5"
        y="6.5"
        width="15"
        height="11"
        rx="2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.8 8.1 12 12.8l6.2-4.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M6.5 5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19h11a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 17.5 5h-11Zm0 1.5h11c.55 0 1 .45 1 1v5.2l-2.53-2.53a1.5 1.5 0 0 0-2.12 0l-4.8 4.8-1.93-1.93a1.5 1.5 0 0 0-2.12 0L5.5 14.54V7.5c0-.55.45-1 1-1Zm1.9 2.05a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

const socialIcons = [
  { key: "linkedin", label: "LinkedIn", icon: <LinkedinIcon /> },
  { key: "instagram", label: "Instagram", icon: <InstagramIcon /> },
  { key: "email", label: "Email", icon: <MailIcon /> },
];

export default function OurTeam() {
  const { t } = useLanguage();
  const members = t.ourTeam.members as TeamMember[];

  return (
    <section className={styles.section} aria-labelledby="our-team-title">
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t.ourTeam.eyebrow}</p>
        <SectionTitle className={styles.title}>{t.ourTeam.title}</SectionTitle>
      </div>

      <div className={styles.grid}>
        {members.map((member) => (
          <article
            key={member.name}
            className={`${styles.card} ${
              member.imagePending ? styles.cardPlaceholder : ""
            }`}
          >
            {member.image ? (
              <Image
                src={member.image}
                alt={member.imageAlt ?? member.name}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className={styles.image}
              />
            ) : null}

            {member.imagePending ? (
              <div className={styles.placeholderPhoto} aria-hidden>
                <ImagePlaceholderIcon />
                <span>{t.ourTeam.photoPlaceholder}</span>
              </div>
            ) : null}

            <div className={styles.overlay} />

            <div className={styles.content}>
              <div className={styles.copy}>
                <h3 className={styles.name}>{member.name}</h3>
                <p className={styles.role}>{member.role}</p>
                <span className={styles.divider} aria-hidden />
                <p className={styles.bio}>{member.bio}</p>
              </div>

              <div className={styles.socials} aria-label={t.ourTeam.socialLabel}>
                {socialIcons.map((social) => (
                  <span
                    key={`${member.name}-${social.key}`}
                    className={styles.socialButton}
                    aria-hidden
                    title={`${member.name} ${social.label}`}
                  >
                    {social.icon}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
