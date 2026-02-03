# Резюме изменений / Summary of changes

## Русский

### CartSidebar (боковая панель корзины)

1. **Шапка в колонку**  
   Блок `.CartSidebar_header` сделан колонкой: в первой строке крестик закрытия прижат вправо (`align-self: flex-end`), во второй строке заголовок прижат влево (`align-self: flex-start`). В разметке сначала идёт кнопка закрытия, затем заголовок.

2. **Иконка закрытия**  
   Стандартный крестик заменён на кастомную SVG (два прямоугольника под −45°, clipPath, viewBox 48×48). Заливка через `currentColor`, id clipPath: `clip0_close`.

3. **Разделители между позициями**  
   У каждого айтема корзины добавлены верхняя и нижняя границы: `1px solid rgba(153, 153, 153, 0.2)` (#999, opacity 0.2). Правило для последнего айтема (убрать нижнюю границу) удалено.

4. **Иконка удаления позиции**  
   Иконка удаления заменена на кастомную SVG (viewBox 28×28, два прямоугольника, clipPath с `rx="14"`). Заливка `currentColor`, id: `clip0_remove`.

5. **Адаптивность**  
   Добавлены медиа-запросы для CartSidebar: 1536px, 1280px, 768px, 480px. Масштабируются: ширина панели, отступы, размер заголовка, крестик, превью товаров, шрифты, кнопки количества, иконка удаления, блок «корзина пуста».

### QuoteOverlay (форма запроса)

6. **Выбор из трёх сервисов**  
   Вместо двух переключателей (MERCHANDISE / Services) одна строка из трёх кнопок: **Private Label**, **Influancer Activation**, **Smart Platform**. Вложенный блок с подвыбором сервиса убран; опция «Merchandise» удалена.

### API (Airtable)

7. **Колонки Services и Description**  
   - **Services** (single select): выбранный сервис отправляется в поле «Services» с точными значениями Airtable: «Private label», «Influancer Activation», «Smart Platform». Маппинг с формы: «Private Label» → «Private label».  
   - **Description** (long text): в поле «Description» уходит только текст из поля описания формы; больше не добавляется строка вида «Service: …» в описание.

### Gallery (галерея)

8. **Картинки из папки, только PNG**  
   Каждый слайд использует изображение из `public/gallery/`: `1.png` … `6.png`. В массив слайдов добавлено поле `src`, в разметке — `<img className={styles.galleryImage} />`. В CSS: `.galleryImage` (absolute, cover, z-index 1), placeholder остаётся фоном (z-index 0), overlay — z-index 2.

### Services (блок сервисов)

9. **Картинки из папки, только PNG**  
   Каждая карточка сервиса показывает PNG из `public/services/`: `1.png` … `5.png` по индексу (`index + 1`). Добавлен `<img src={/services/${index + 1}.png} className={styles.serviceImageImg} />` и стиль `.serviceImageImg` (100% × 100%, object-fit: cover).

---

## English

### CartSidebar

1. **Header as column**  
   `.CartSidebar_header` is a column: first row — close button aligned right (`align-self: flex-end`), second row — title aligned left (`align-self: flex-start`). Markup order: close button first, then title.

2. **Close icon**  
   Default close icon replaced with custom SVG (two rects at −45°, clipPath, viewBox 48×48). Fill via `currentColor`, clipPath id: `clip0_close`.

3. **Item dividers**  
   Each cart item has top and bottom borders: `1px solid rgba(153, 153, 153, 0.2)` (#999, opacity 0.2). Rule that removed bottom border on last item was removed.

4. **Remove item icon**  
   Remove icon replaced with custom SVG (viewBox 28×28, two rects, clipPath with `rx="14"`). Fill `currentColor`, id: `clip0_remove`.

5. **Responsive**  
   Media queries for CartSidebar at 1536px, 1280px, 768px, 480px. Scaled: panel width, padding, title size, close icon, item images, fonts, quantity controls, remove icon, empty state.

### QuoteOverlay

6. **Three service options**  
   Instead of two toggles (MERCHANDISE / Services), a single row of three buttons: **Private Label**, **Influancer Activation**, **Smart Platform**. Nested service sub-selection removed; “Merchandise” option removed.

### API (Airtable)

7. **Services and Description columns**  
   - **Services** (single select): selected service is sent to “Services” with exact Airtable values: “Private label”, “Influancer Activation”, “Smart Platform”. Form mapping: “Private Label” → “Private label”.  
   - **Description** (long text): only the description field text is sent to “Description”; no longer appending “Service: …” to the description.

### Gallery

8. **Images from folder, PNG only**  
   Each slide uses an image from `public/gallery/`: `1.png` … `6.png`. Added `src` to slide data and `<img className={styles.galleryImage} />`. CSS: `.galleryImage` (absolute, cover, z-index 1), placeholder as background (z-index 0), overlay z-index 2.

### Services

9. **Images from folder, PNG only**  
   Each service card shows a PNG from `public/services/`: `1.png` … `5.png` by index (`index + 1`). Added `<img src={/services/${index + 1}.png} className={styles.serviceImageImg} />` and `.serviceImageImg` (100% × 100%, object-fit: cover).
