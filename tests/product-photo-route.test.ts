import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/products/catalogSnapshot", () => ({
  getCatalogSnapshot: vi.fn(),
}));

vi.mock("../server/http/fetchWithDeadline", async () => {
  const actual = await vi.importActual<
    typeof import("../server/http/fetchWithDeadline")
  >("../server/http/fetchWithDeadline");
  return { ...actual, fetchWithDeadline: vi.fn() };
});

const RECORD_ID = "recTest123";
const ATTACHMENT_ID = "attTest456";

/** Подписанная ссылка того же вида, что приходит из Airtable. */
const SIGNED_URL =
  "https://v5.airtableusercontent.com/v3/u/41/41/x.jpg?sig=TOPSECRETSIGNATURE&exp=1700000000";

const ORIGINAL_ENV = process.env;

const callRoute = async (width = "original", search = "") => {
  const { GET } = await import(
    "../app/api/product-photo/[recordId]/[attachmentId]/[width]/route"
  );
  const request = new Request(
    `http://localhost/api/product-photo/${RECORD_ID}/${ATTACHMENT_ID}/${width}${search}`
  );
  return GET(request as never, {
    params: Promise.resolve({
      recordId: RECORD_ID,
      attachmentId: ATTACHMENT_ID,
      width,
    }),
  });
};

/**
 * Прокси фотографий — единственное место, где подписанная ссылка Airtable
 * оказывается в руках у кода, который пишет логи. Эти проверки следят за двумя
 * вещами: что по логу можно восстановить ход запроса и что в нём нет ссылки.
 */
describe("api/product-photo", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV, API_TOKEN: "patTestToken12345" };
    vi.resetModules();

    const { getCatalogSnapshot } = await import(
      "../server/products/catalogSnapshot"
    );
    (getCatalogSnapshot as ReturnType<typeof vi.fn>).mockResolvedValue({
      records: [
        {
          id: RECORD_ID,
          imageId: ATTACHMENT_ID,
          imageUrlOriginal: SIGNED_URL,
        },
      ],
      fetchedAt: Date.now(),
      stale: false,
    });
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it("отдаёт мастер-копию в WebP, а не исходный PNG", async () => {
    const sharp = (await import("sharp")).default;
    // Тяжёлый PNG того же вида, что лежит в Airtable: 2048x2048 без сжатия.
    const png = await sharp({
      create: {
        width: 2048,
        height: 2048,
        channels: 3,
        // Шум даёт картинку, которую нечем сжать «в ноль», — иначе проверка
        // «мастер легче исходника вдвое» прошла бы на любой заливке.
        // background типам sharp нужен даже вместе с noise.
        background: { r: 0, g: 0, b: 0 },
        noise: { type: "gaussian", mean: 128, sigma: 30 },
      },
    })
      .png()
      .toBuffer();

    const { fetchWithDeadline } = await import(
      "../server/http/fetchWithDeadline"
    );
    (fetchWithDeadline as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "image/png" }),
      body: png,
    });

    const response = await callRoute("master");
    const body = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");

    const meta = await sharp(body).metadata();
    expect(meta.format).toBe("webp");
    // Разрешение не режется: уменьшать должен только оптимизатор, иначе
    // передискретизация происходит дважды.
    expect(meta.width).toBe(2048);
    // Ради этого всё и делалось — оптимизатор тащит на порядок меньше.
    expect(body.byteLength).toBeLessThan(png.byteLength / 2);
  });

  it("по-прежнему отдаёт нетронутые байты по адресу original", async () => {
    const { fetchWithDeadline } = await import(
      "../server/http/fetchWithDeadline"
    );
    const bytes = Buffer.alloc(256, 9);
    (fetchWithDeadline as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "image/png" }),
      body: bytes,
    });

    const response = await callRoute("original");

    expect(response.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await response.arrayBuffer()).equals(bytes)).toBe(true);
  });

  it("отдаёт байты и идентификатор запроса в заголовке", async () => {
    const { fetchWithDeadline } = await import(
      "../server/http/fetchWithDeadline"
    );
    (fetchWithDeadline as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      body: Buffer.alloc(128, 3),
    });

    const response = await callRoute();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-photo-request-id")).toMatch(/^[0-9a-f]{8}$/);
  });

  it("на таймауте отвечает 504 и пишет этап, длительность и хост источника", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { fetchWithDeadline, FetchDeadlineError } = await import(
      "../server/http/fetchWithDeadline"
    );
    (fetchWithDeadline as ReturnType<typeof vi.fn>).mockRejectedValue(
      new FetchDeadlineError(`Источник не ответил за 10000 мс`, true, {
        cause: new Error(`connect ETIMEDOUT ${SIGNED_URL}`),
      })
    );

    const response = await callRoute();

    expect(response.status).toBe(504);

    const logged = JSON.parse(error.mock.calls[0][0] as string);
    expect(logged.tag).toBe("photo");
    expect(logged.outcome).toBe("timeout");
    expect(logged.stage).toBe("fetch");
    expect(logged.recordId).toBe(RECORD_ID);
    expect(logged.attachmentId).toBe(ATTACHMENT_ID);
    expect(logged.sourceHost).toBe("v5.airtableusercontent.com");
    expect(typeof logged.fetchMs).toBe("number");
    expect(logged.fromSnapshot).toBe(true);
  });

  it("не выносит в лог подписанную ссылку и токен", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { fetchWithDeadline, FetchDeadlineError } = await import(
      "../server/http/fetchWithDeadline"
    );
    (fetchWithDeadline as ReturnType<typeof vi.fn>).mockRejectedValue(
      new FetchDeadlineError("Не удалось загрузить источник", false, {
        cause: new Error(`socket hang up while reading ${SIGNED_URL}`),
      })
    );

    await callRoute();

    const line = error.mock.calls[0][0] as string;
    expect(line).not.toContain("TOPSECRETSIGNATURE");
    expect(line).not.toContain("sig=");
    expect(line).not.toContain("patTestToken12345");
    // Хост при этом остаётся — без него непонятно, куда вообще ходили.
    expect(line).toContain("v5.airtableusercontent.com");
  });

  it("обрыв соединения отделяет от таймаута", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { fetchWithDeadline, FetchDeadlineError } = await import(
      "../server/http/fetchWithDeadline"
    );
    (fetchWithDeadline as ReturnType<typeof vi.fn>).mockRejectedValue(
      new FetchDeadlineError("Не удалось загрузить источник", false)
    );

    const response = await callRoute();

    expect(response.status).toBe(502);
  });

  it("помечает в логе повторную попытку браузера", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { fetchWithDeadline, FetchDeadlineError } = await import(
      "../server/http/fetchWithDeadline"
    );
    (fetchWithDeadline as ReturnType<typeof vi.fn>).mockRejectedValue(
      new FetchDeadlineError("Источник не ответил за 10000 мс", true)
    );

    await callRoute("original", "?r=1");

    expect(JSON.parse(error.mock.calls[0][0] as string).retry).toBe(1);
  });

  it("не пишет строку про быстрый успешный запрос", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { fetchWithDeadline } = await import(
      "../server/http/fetchWithDeadline"
    );
    (fetchWithDeadline as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      body: Buffer.alloc(128, 3),
    });

    await callRoute();

    // Каталог — это сотни картинок на страницу. Строка про каждую утопила бы
    // тот единственный сбой, ради которого лог и заводился.
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});
