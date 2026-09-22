import { getSlot } from "../../../../../content/slots";
import {
  discardSlotFromDraft,
  getDraftState,
  saveToDraft,
} from "../../../../../server/github/repo";
import { optimizeSlotImage } from "../../../../../server/media/optimize";
import { parseFocal } from "../../../../admin/_lib/focal";
import { readMediaFile } from "../../_lib/draftFile";
import { withFocal } from "../../_lib/entry";
import { fail, failure, ok, settingsProblem } from "../../_lib/respond";

/**
 * Замена фотографии одного слота и отмена этой замены.
 *
 * Сжатие идёт здесь, а не в браузере: правила ширин и качества живут в
 * server/media/optimize.ts и должны быть ровно теми же, что у остальных
 * фотографий сайта. Браузер только уменьшает файл до предела платформы.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * Сжатие в несколько ширин плюс заливка вариантов в репозиторий не укладывается
 * в стандартные десять секунд на тяжёлом снимке. Обрыв на середине выглядит для
 * клиента как «нажал и ничего не произошло», хотя часть блобов уже залита.
 */
export const maxDuration = 60;

/**
 * Предел на файл. Платформа рубит тело около 4.5 МБ и делает это молча, без
 * разбираемого ответа, поэтому свой предел держим чуть ниже — тогда клиент
 * получает внятную фразу, а не оборванное соединение.
 */
const MAX_FILE_BYTES = 4_400_000;

const badSlot = () =>
  fail("Такого места на сайте нет. Вернитесь к списку и выберите слот заново.", 404);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const problem = settingsProblem();
  if (problem) return fail(problem, 503);

  const { key } = await params;
  const slot = getSlot(key);
  if (!slot) return badSlot();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Не удалось получить файл. Попробуйте выбрать фотографию заново.", 400);
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return fail("Файл не приложен. Выберите фотографию и попробуйте снова.", 400);
  }
  if (file.size === 0) {
    return fail("Файл пустой. Выберите другую фотографию.", 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    return fail(
      "Фотография слишком большая даже после уменьшения. " +
        "Попробуйте другой файл или сохраните его из редактора поменьше.",
      413
    );
  }

  const focal = parseFocal(form.get("focal"));
  const source = Buffer.from(await file.arrayBuffer());

  let optimized;
  try {
    optimized = await optimizeSlotImage(slot, source);
  } catch (error) {
    console.error("[admin] сжатие фотографии", error);
    return fail(
      "Не получилось прочитать эту фотографию — похоже, файл повреждён " +
        "или это не изображение. Попробуйте другой.",
      400
    );
  }

  const entry = withFocal(optimized.entry, focal);

  try {
    const saved = await saveToDraft({
      slotKey: slot.key,
      files: optimized.files,
      entry,
    });

    return ok({
      entry,
      source: optimized.source,
      files: optimized.files.length,
      removed: saved.removed.length,
    });
  } catch (error) {
    return failure(`сохранение слота ${slot.key}`, error);
  }
}

/**
 * Смена только точки кадра.
 *
 * Нового файла нет, но saveToDraft без файлов не работает — и правильно
 * делает: это его защита от пустого коммита. Поэтому текущие варианты слота
 * читаются из ветки и отправляются обратно теми же байтами. Содержимое не
 * меняется, значит sha блобов совпадают, дерево остаётся прежним, и в коммит
 * реально уходит одна строчка media.json.
 *
 * Альтернатива — просить клиента заново загрузить ту же фотографию ради
 * сдвига точки на пять процентов. Это и лишняя перекодировка, и вопрос «а где
 * теперь взять файл, который вы мне показываете».
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const problem = settingsProblem();
  if (problem) return fail(problem, 503);

  const { key } = await params;
  const slot = getSlot(key);
  if (!slot) return badSlot();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Не удалось прочитать запрос. Обновите страницу.", 400);
  }

  const focal = parseFocal((body as { focal?: unknown } | null)?.focal);

  try {
    const state = await getDraftState();
    const entry = state.media.slots[slot.key];
    if (!entry?.variants?.length) {
      return fail(
        "Для этого места ещё нет фотографии — сначала загрузите файл.",
        400
      );
    }

    const files: { name: string; path: string; buffer: Buffer }[] = [];
    for (const variant of entry.variants) {
      const path = variant.src.replace(/^\//, "");
      const file = await readMediaFile(path);
      if (!file) {
        return fail(
          "Не нашлись файлы этой фотографии. Загрузите её заново — тогда точку кадра можно будет поставить.",
          409
        );
      }
      files.push({
        name: path.slice(path.lastIndexOf("/") + 1),
        path,
        buffer: file.body,
      });
    }

    await saveToDraft({
      slotKey: slot.key,
      files,
      entry: withFocal(entry, focal),
    });
    return ok({ changed: true });
  } catch (error) {
    return failure(`точка кадра слота ${slot.key}`, error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const problem = settingsProblem();
  if (problem) return fail(problem, 503);

  const { key } = await params;
  const slot = getSlot(key);
  if (!slot) return badSlot();

  try {
    const result = await discardSlotFromDraft(slot.key);
    return ok({ changed: result.changed });
  } catch (error) {
    return failure(`отмена слота ${slot.key}`, error);
  }
}
