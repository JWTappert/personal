import React from "react";
import Link from "next/link";
import styles from "./nav.module.scss";

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <Link href="/experience">
        <a className={styles.link}>
          <span data-content="Experience">Experience</span>
        </a>
      </Link>
      <Link href="/contact">
        <a className={styles.link}>
          <span data-content="Contact">Contact</span>
        </a>
      </Link>
    </nav>
  );
}
