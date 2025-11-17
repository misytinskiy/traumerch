"use client";

import { useLanguage } from "../../contexts/LanguageContext";
import SectionTitle from "../SectionTitle/SectionTitle";
import Button from "../Button/Button";
import styles from "./Products.module.css";

interface Product {
  id: number;
  name: string;
  price: string;
}

export default function Products() {
  const { t } = useLanguage();

  const products: Product[] = Array.from({ length: 4 }, (_, index) => ({
    id: index + 1,
    name: t.products.productName,
    price: t.products.priceFrom,
  }));

  const handleProductClick = (productId: number) => {
    // Navigate to design page for the specific product
    window.location.href = `/design?product=${productId}`;
  };

  const handleSeeAllClick = () => {
    // Navigate to catalog page
    window.location.href = "/catalog";
  };

  return (
    <section className={styles.products}>
      <div className={styles.header}>
        <SectionTitle maxWidth={500}>{t.products.title}</SectionTitle>
      </div>

      <div className={styles.grid}>
        {products.map((product) => (
          <div
            key={product.id}
            className={styles.productCard}
            onClick={() => handleProductClick(product.id)}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.productImage} />
            <h3 className={styles.productName}>{product.name}</h3>
            <p className={styles.productPrice}>{product.price}</p>
          </div>
        ))}
      </div>

      <div className={styles.seeAllContainer}>
        <Button
          variant="transparent"
          padding="31px 65px"
          padding350="26px 49px"
          padding768="41px 76px"
          arrow="black"
          onClick={handleSeeAllClick}
        >
          {t.products.seeAll}
        </Button>
      </div>
    </section>
  );
}
