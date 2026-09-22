/**
 * Уменьшение фотографии в браузере до отправки на сервер.
 *
 * ПОЧЕМУ это вообще нужно. Тело запроса к функции Vercel ограничено примерно
 * 4.5 МБ, а снимок с телефона весит 8-15 МБ. Без уменьшения на клиенте первая
 * же настоящая фотография клиента упрётся в лимит платформы — и не в нашу
 * ошибку, которую можно объяснить, а в обрыв запроса без внятного ответа.
 *
 * Модуль чисто клиентский: sharp и конвейер сжатия сюда не тянем, иначе всё
 * это уехало бы в бандл браузера. Настоящее сжатие делает сервер, здесь только
 * «влезть в лимит и не потерять ориентацию».
 */

/** Дальше этой ширины конвейер всё равно не делает вариантов. */
export const MAX_UPLOAD_EDGE = 2560;

/**
 * Предел на тело запроса. У Vercel это ~4.5 МБ; берём с запасом, потому что
 * multipart добавляет границы и заголовки, а браузер — свои.
 */
export const MAX_UPLOAD_BYTES = 4_000_000;

/**
 * Лесенка качества. Первый шаг — то самое «примерно 0.92»; следующие нужны для
 * редкого случая, когда даже 2560px не влезают в лимит (панорама, плотная
 * текстура). Лучше отдать чуть более сжатый исходник, чем показать клиенту
 * «файл слишком большой» и оставить его без вариантов.
 */
export const QUALITY_STEPS = [0.92, 0.82, 0.7] as const;

export type PixelSize = { width: number; height: number };

/**
 * Размер после вписывания длинной стороны в предел.
 *
 * Апскейла нет никогда: если фотография мельче предела, она возвращается как
 * есть. Растянутый исходник не добавляет деталей, зато весит больше и создаёт
 * ложное ощущение, что с разрешением всё в порядке.
 */
export const fitLongestSide = (size: PixelSize, max: number): PixelSize => {
  const longest = Math.max(size.width, size.height);
  if (longest <= max || longest === 0) {
    return { width: size.width, height: size.height };
  }
  const scale = max / longest;
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
};

/**
 * Надо ли вообще перекодировать файл.
 *
 * Если исходник и так влезает в лимит и не шире предела — отправляем его
 * байт в байт. Лишняя перекодировка через canvas это второе поколение потерь
 * поверх первого, а у логотипов ещё и потеря прозрачности.
 */
export const needsReencode = (
  size: PixelSize,
  bytes: number,
  { maxEdge = MAX_UPLOAD_EDGE, maxBytes = MAX_UPLOAD_BYTES } = {}
): boolean =>
  bytes > maxBytes || Math.max(size.width, size.height) > maxEdge;

export type PreparedUpload = {
  /** Что уходит на сервер. */
  blob: Blob;
  /** Имя файла для multipart — сервер по нему ничего не решает, но в логах видно. */
  fileName: string;
  /** Размеры ПОСЛЕ поворота по EXIF: по ним считается предупреждение о мелком фото. */
  width: number;
  height: number;
  /** true — файл пересобран в браузере, а не отправлен как есть. */
  reencoded: boolean;
};

/**
 * Имя для пересобранного файла: расширение должно соответствовать типу,
 * иначе в логах и в отладке лежит .heic, внутри которого webp.
 */
const reencodedName = (original: string, mime: string): string => {
  const base = original.replace(/\.[^./\\]+$/, "") || "photo";
  const ext = mime === "image/webp" ? "webp" : "jpg";
  return `${base}.${ext}`;
};

/**
 * Рисует картинку в canvas и отдаёт blob.
 *
 * WebP предпочтительнее JPEG при равном качестве и, главное, сохраняет
 * прозрачность: среди слотов есть логотипы с альфа-каналом, и JPEG залил бы
 * её чёрным. Если браузер webp в canvas не умеет, toBlob отдаёт PNG или JPEG —
 * тип проверяем по факту и при несовпадении честно идём в JPEG.
 */
const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number
): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, mime, quality));

/**
 * Готовит выбранный файл к отправке.
 *
 * imageOrientation: "from-image" обязателен. Без него кадр с телефона,
 * у которого поворот записан только в EXIF, попадёт в canvas боком и таким же
 * уедет на сервер — сам canvas никакого EXIF не знает.
 */
export const prepareUpload = async (file: File): Promise<PreparedUpload> => {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  try {
    const source = { width: bitmap.width, height: bitmap.height };

    if (!needsReencode(source, file.size)) {
      return {
        blob: file,
        fileName: file.name || "photo",
        width: source.width,
        height: source.height,
        reencoded: false,
      };
    }

    const target = fitLongestSide(source, MAX_UPLOAD_EDGE);
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Браузер не дал нарисовать изображение — обновите страницу.");
    }
    context.drawImage(bitmap, 0, 0, target.width, target.height);

    let best: Blob | null = null;
    for (const quality of QUALITY_STEPS) {
      let blob = await canvasToBlob(canvas, "image/webp", quality);
      if (!blob || blob.type !== "image/webp") {
        blob = await canvasToBlob(canvas, "image/jpeg", quality);
      }
      if (!blob) continue;
      best = blob;
      if (blob.size <= MAX_UPLOAD_BYTES) break;
    }

    if (!best) {
      throw new Error("Не удалось подготовить файл к отправке.");
    }

    return {
      blob: best,
      fileName: reencodedName(file.name || "photo", best.type),
      width: target.width,
      height: target.height,
      reencoded: true,
    };
  } finally {
    // Битмап держит несжатые пиксели: для 12-мегапиксельного снимка это
    // около 50 МБ. На пачке замен подряд без close() вкладка заметно пухнет.
    bitmap.close();
  }
};
