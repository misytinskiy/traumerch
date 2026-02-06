"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ResponsiveHeader from "../../../components/Header/ResponsiveHeader";
import CTA from "../../../components/CTA/CTA";
import Footer from "../../../components/Footer/Footer";
import Button from "../../../components/Button/Button";
import { useCart } from "../../../contexts/CartContext";
import { getMainPhotoUrl } from "../../../lib/product";
import { getMinQuantity, getPriceForQuantity } from "../../../lib/pricing";
import styles from "./contact.module.css";

const getSwatchColor = (color: string) => {
  if (!color) return "#111";
  if (color.startsWith("#")) return color;
  const normalized = color.toLowerCase();
  if (normalized === "white") return "#f5f5f5";
  if (normalized === "black") return "#111";
  return normalized;
};

export default function QuoteContactPage() {
  const router = useRouter();
  const { items, updateItemQuantity } = useCart();
  const [quantityInputByIndex, setQuantityInputByIndex] = useState<
    Record<number, string>
  >({});

  const displayItems = useMemo(() => items, [items]);

  const countryOptions = ["Italy", "Germany", "France", "Spain"];
  const [selectedCountry, setSelectedCountry] = useState("Italy");
  const [selectOpen, setSelectOpen] = useState(false);
  const selectWrapRef = useRef<HTMLDivElement>(null);

  const [deliveryDate, setDeliveryDate] = useState("2026-11-03");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarView, setCalendarView] = useState(() => {
    const d = new Date(2026, 10, 3);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectWrapRef.current && !selectWrapRef.current.contains(e.target as Node)) {
        setSelectOpen(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplayDate = (iso: string) => {
    const d = new Date(iso + "T12:00:00");
    const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const days: (number | null)[] = Array(startPad).fill(null);
    for (let i = 1; i <= last.getDate(); i++) days.push(i);
    const total = 42;
    while (days.length < total) days.push(null);
    return days.slice(0, total);
  };

  const handleSelectDate = (year: number, month: number, day: number) => {
    const y = String(year);
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    setDeliveryDate(`${y}-${m}-${d}`);
    setCalendarOpen(false);
  };

  const isSelected = (year: number, month: number, day: number) => {
    const [y, m, d] = deliveryDate.split("-").map(Number);
    return y === year && m === month + 1 && d === day;
  };

  const isToday = (year: number, month: number, day: number) => {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
  };

  const getQuantityDisplay = (index: number, fallback: number) => {
    const raw = quantityInputByIndex[index];
    if (raw === undefined) return String(fallback);
    return raw;
  };

  const handleQuantityChange = (
    index: number,
    value: string,
    minQuantity: number
  ) => {
    setQuantityInputByIndex((prev) => ({ ...prev, [index]: value }));
    const trimmed = value.trim();
    if (trimmed === "") return;
    const num = parseInt(trimmed, 10);
    if (!Number.isNaN(num)) {
      updateItemQuantity(index, Math.max(minQuantity, Math.min(num, 99999)));
    }
  };

  const handleQuantityBlur = (
    index: number,
    currentQuantity: number,
    minQuantity: number
  ) => {
    const raw = quantityInputByIndex[index];
    if (raw === undefined || raw.trim() === "") {
      setQuantityInputByIndex((prev) => ({
        ...prev,
        [index]: String(currentQuantity),
      })); 
      return;
    }
    const num = parseInt(raw, 10);
    if (Number.isNaN(num)) {
      setQuantityInputByIndex((prev) => ({
        ...prev,
        [index]: String(currentQuantity),
      }));
      return;
    }
    const clamped = Math.max(minQuantity, Math.min(num, 99999));
    setQuantityInputByIndex((prev) => ({
      ...prev,
      [index]: String(clamped),
    }));
    updateItemQuantity(index, clamped);
  };

  return (
    <div className={styles.page}>
      <ResponsiveHeader />
      <main className={styles.main}>
        <h1 className={styles.title}>
          Contact
          <br />
          information
        </h1>

        <div className={styles.layout}>
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Your information</h2>
            <div className={styles.formGrid}>
              <div className={styles.rowTwo}>
                <input className={styles.input} placeholder="First name" />
                <input className={styles.input} placeholder="Last name" />
              </div>
              <input className={styles.input} placeholder="Email" />
              <input className={styles.input} placeholder="Company name" />
              <input className={styles.input} placeholder="Phone number" />
              <input className={styles.input} placeholder="Address" />
              <input className={styles.input} placeholder="Apartment (optional)" />
              <div className={styles.rowTwo}>
                <input className={styles.input} placeholder="Postal code" />
                <input className={styles.input} placeholder="City" />
              </div>
              <div className={styles.rowTwo}>
                <div className={styles.selectWrap} ref={selectWrapRef}>
                  <input type="hidden" name="country" value={selectedCountry} readOnly />
                  <button
                    type="button"
                    className={styles.selectTrigger}
                    onClick={() => setSelectOpen((o) => !o)}
                    aria-expanded={selectOpen}
                    aria-haspopup="listbox"
                    aria-label="Country"
                  >
                    <span className={styles.selectTriggerText}>{selectedCountry}</span>
                    <span className={`${styles.selectArrow} ${selectOpen ? styles.selectArrowOpen : ""}`} aria-hidden>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M16.8582 8.95199L17.9182 10.013L12.1412 15.792C12.0487 15.8851 11.9386 15.9591 11.8173 16.0095C11.6961 16.06 11.5661 16.0859 11.4347 16.0859C11.3034 16.0859 11.1734 16.06 11.0521 16.0095C10.9309 15.9591 10.8208 15.8851 10.7282 15.792L4.94824 10.013L6.00824 8.95299L11.4332 14.377L16.8582 8.95199Z" fill="#999999" />
                      </svg>
                    </span>
                  </button>
                  <ul
                    className={`${styles.selectDropdown} ${selectOpen ? styles.selectDropdownOpen : ""}`}
                    role="listbox"
                    aria-label="Country"
                  >
                    {countryOptions.map((option) => (
                      <li
                        key={option}
                        role="option"
                        aria-selected={selectedCountry === option}
                        className={styles.selectOption}
                        onClick={() => {
                          setSelectedCountry(option);
                          setSelectOpen(false);
                        }}
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
                <input className={styles.input} placeholder="Vat number" />
              </div>
            </div>

            <label className={styles.checkboxRow}>
              <input type="checkbox" defaultChecked />
              <span>Use the same address for shipping</span>
            </label>

            <div className={styles.deliveryBlock}>
              <h3 className={styles.sectionSubtitle}>Delivery date</h3>
              <div className={styles.deliveryRow}>
                <span>Let us know your preferred in-hands date:</span>
                <div className={styles.datePickerWrap} ref={datePickerRef}>
                  <input type="hidden" name="deliveryDate" value={deliveryDate} readOnly />
                  <button
                    type="button"
                    className={styles.dateTrigger}
                    onClick={() => setCalendarOpen((o) => !o)}
                    aria-expanded={calendarOpen}
                    aria-haspopup="dialog"
                    aria-label="Delivery date"
                  >
                    <span className={styles.dateTriggerText}>{formatDisplayDate(deliveryDate)}</span>
                    <span className={styles.dateTriggerIcon} aria-hidden>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </span>
                  </button>
                  <div
                    className={`${styles.dateCalendar} ${calendarOpen ? styles.dateCalendarOpen : ""}`}
                    role="dialog"
                    aria-label="Choose date"
                  >
                    <div className={styles.dateCalendarHeader}>
                      <button
                        type="button"
                        className={styles.dateCalendarNav}
                        onClick={() =>
                          setCalendarView((v) =>
                            v.month === 0
                              ? { year: v.year - 1, month: 11 }
                              : { ...v, month: v.month - 1 }
                          )
                        }
                        aria-label="Previous month"
                      >
                        ‹
                      </button>
                      <span className={styles.dateCalendarTitle}>
                        {new Date(calendarView.year, calendarView.month).toLocaleString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <button
                        type="button"
                        className={styles.dateCalendarNav}
                        onClick={() =>
                          setCalendarView((v) =>
                            v.month === 11
                              ? { year: v.year + 1, month: 0 }
                              : { ...v, month: v.month + 1 }
                          )
                        }
                        aria-label="Next month"
                      >
                        ›
                      </button>
                    </div>
                    <div className={styles.dateWeekdays}>
                      {"Sun Mon Tue Wed Thu Fri Sat".split(" ").map((w) => (
                        <span key={w} className={styles.dateWeekday}>
                          {w}
                        </span>
                      ))}
                    </div>
                    <div className={styles.dateCalendarGrid}>
                      {getDaysInMonth(calendarView.year, calendarView.month).map((day, i) =>
                        day === null ? (
                          <span key={`e-${i}`} className={styles.dateDayEmpty} />
                        ) : (
                          <button
                            key={`${calendarView.year}-${calendarView.month}-${day}`}
                            type="button"
                            className={`${styles.dateDay} ${
                              isSelected(calendarView.year, calendarView.month, day)
                                ? styles.dateDaySelected
                                : ""
                            } ${isToday(calendarView.year, calendarView.month, day) ? styles.dateDayToday : ""}`}
                            onClick={() =>
                              handleSelectDate(calendarView.year, calendarView.month, day)
                            }
                          >
                            {day}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.footerBar}>
          <Button
            variant="transparent"
            size="medium"
            padding="31px 84px"
            onClick={() => router.push("/catalog")}
          >
            Back to shopping
          </Button>
          <Button
            variant="solid"
            size="medium"
            padding="31px 93px"
            arrow="white"
          >
            Continue
          </Button>
        </div>
          </section>

          <aside className={styles.quoteSection}>
            <h2 className={styles.sectionTitle}>Your quote</h2>
            <div className={styles.quoteList}>
              {displayItems.map((item, index) => {
                const photoUrl = getMainPhotoUrl(item.productFields) ?? "";
                const minQuantity = getMinQuantity(item.productFields);
                const price =
                  getPriceForQuantity(item.quantity, item.productFields) ?? "—";
                return (
                  <article
                    className={styles.quoteCard}
                    key={`${item.productId}-${index}`}
                  >
                    <div className={styles.quoteMedia}>
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={item.productName}
                          className={styles.quoteImage}
                        />
                      ) : (
                        <div className={styles.quoteImagePlaceholder} />
                      )}
                    </div>
                    <div className={styles.quoteInfo}>
                      <div className={styles.quoteHeader}>
                        <div className={styles.quoteTextStack}>
                          <div className={styles.quoteName}>{item.productName}</div>
                          <div className={styles.quoteMetaGroup}>
                            <div className={styles.quoteMeta}>Price: {price}</div>
                            <div className={styles.quoteMeta}>
                              Color:
                              <span
                                className={styles.quoteSwatch}
                                style={{
                                  backgroundColor: getSwatchColor(
                                    item.selectedColor
                                  ),
                                }}
                              />
                              {item.selectedColor || "-"}
                            </div>
                          </div>
                        </div>
                        <div className={styles.quantityControls}>
                          <button
                            type="button"
                            className={styles.quantityButton}
                            onClick={() => {
                              const next = Math.max(
                                minQuantity,
                                item.quantity - 1
                              );
                              updateItemQuantity(index, next);
                              setQuantityInputByIndex((prev) => ({
                                ...prev,
                                [index]: String(next),
                              }));
                            }}
                            disabled={item.quantity <= minQuantity}
                          >
                            <svg width="12" height="1" viewBox="0 0 12 1" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                              <rect width="12" height="1" rx="0.5" fill="currentColor" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            className={styles.quantityInput}
                            value={getQuantityDisplay(index, item.quantity)}
                            min={minQuantity}
                            max={99999}
                            onChange={(e) =>
                              handleQuantityChange(
                                index,
                                e.target.value,
                                minQuantity
                              )
                            }
                            onBlur={() =>
                              handleQuantityBlur(
                                index,
                                item.quantity,
                                minQuantity
                              )
                            }
                            aria-label="Quantity"
                          />
                          <button
                            type="button"
                            className={styles.quantityButton}
                            onClick={() => {
                              const next = Math.min(99999, item.quantity + 1);
                              updateItemQuantity(index, next);
                              setQuantityInputByIndex((prev) => ({
                                ...prev,
                                [index]: String(next),
                              }));
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                              <rect y="5.92188" width="12.5" height="0.657895" rx="0.328947" fill="currentColor" />
                              <rect x="5.92114" y="12.5" width="12.5" height="0.657895" rx="0.328947" transform="rotate(-90 5.92114 12.5)" fill="currentColor" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </aside>
        </div>


      </main>
      <CTA />
      <Footer />
    </div>
  );
}
