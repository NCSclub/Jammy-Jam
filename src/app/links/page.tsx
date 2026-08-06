import type { CSSProperties } from "react";
import Image from "next/image";
import { FaDiscord, FaInstagram, FaLinkedinIn, FaTiktok } from "react-icons/fa6";
import styles from "./links.module.css";

const SOCIAL_LINKS = [
  {
    platform: "Instagram",
    name: "@ncs._club",
    href: "https://www.instagram.com/ncs._club?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    icon: FaInstagram,
    tone: "blue",
  },
  {
    platform: "TikTok",
    name: "@nit_computer_society",
    href: "https://www.tiktok.com/@nit_computer_society?is_from_webapp=1&sender_device=pc",
    icon: FaTiktok,
    tone: "yellow",
  },
  {
    platform: "LinkedIn",
    name: "NCS Club",
    href: "https://tr.ee/2R6wB66gNj",
    icon: FaLinkedinIn,
    tone: "blue",
  },
  {
    platform: "Discord",
    name: "Rejoindre le serveur",
    href: "https://discord.gg/ATMmZq86uu",
    icon: FaDiscord,
    tone: "yellow",
  },
] as const;

export default function LinksPage() {
  return (
    <main className={styles.page}>
      <div className={styles.sky} aria-hidden="true">
        <span className={`${styles.cloud} ${styles.cloudOne}`} />
        <span className={`${styles.cloud} ${styles.cloudSmall} ${styles.cloudTwo}`} />
        <span className={`${styles.cloud} ${styles.cloudThree}`} />
        <span className={`${styles.cloud} ${styles.cloudSmall} ${styles.cloudFour}`} />
        <span className={`${styles.cloud} ${styles.cloudFive}`} />
        <span className={`${styles.ring} ${styles.ringOne}`} />
        <span className={`${styles.ring} ${styles.ringTwo}`} />
        <span className={`${styles.ring} ${styles.ringThree}`} />
      </div>

      <div className={styles.ground} aria-hidden="true" />

      <div className={styles.panel}>
        <header className={styles.header}>
          <Image
            className={styles.logo}
            src="/brand/jammy-jam-logo.png"
            alt="Jammy Jam"
            width={598}
            height={422}
            priority
          />
          <div className={styles.edition}>Jammy Jam</div>
          <p className={styles.subtitle}>7 jours · 1 thème · 1 jeu</p>
        </header>

        <nav className={styles.socialLinks} aria-label="Réseaux sociaux">
          {SOCIAL_LINKS.map((link, index) => {
            const Icon = link.icon;

            return (
              <a
                className={`${styles.socialCard} ${
                  link.tone === "yellow" ? styles.yellowCard : styles.blueCard
                }`}
                href={link.href}
                key={link.platform}
                target="_blank"
                rel="noreferrer"
                style={{ "--link-index": index } as CSSProperties}
                aria-label={`${link.platform} — ${link.name}`}
              >
                <span className={styles.socialIcon} aria-hidden="true">
                  <Icon />
                </span>
                <span className={styles.socialCopy}>
                  <span className={styles.socialPlatform}>{link.platform}</span>
                  <span className={styles.socialName}>{link.name}</span>
                </span>
                <span className={styles.socialArrow} aria-hidden="true">
                  →
                </span>
              </a>
            );
          })}
        </nav>

        <footer className={styles.footer}>
          <a href="mailto:numidiacomputersociety@gmail.com">
            numidiacomputersociety@gmail.com
          </a>
          <p>
            Crée <span>—</span> joue <span>—</span> partage <span>—</span>{" "}
            <strong>jam</strong>
          </p>
        </footer>
      </div>
    </main>
  );
}
