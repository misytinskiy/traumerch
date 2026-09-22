import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  discardDraft,
  discardSlotFromDraft,
  getDraftState,
  publishDraft,
  saveToDraft,
} from "../server/github/repo";

/**
 * Серверный слой работы с GitHub проверяется на подменённом fetch: настоящих
 * запросов тут нет и быть не должно — токена нет, а тратить квоту API на
 * прогон тестов смысла тем более нет.
 *
 * Фейк не «отвечает заготовками», а держит состояние репозитория: ветки,
 * деревья, файлы. Иначе проверить главное — что публикация собирает дерево
 * поверх головы ОСНОВНОЙ ветки, а не черновика — не получится: в заготовках
 * это выглядело бы одинаково.
 */

const TOKEN = "github_pat_11AAAAAAA0verysecrettokenvalue";
const OWNER_REPO = "misytinskiy/traumerch";
const R = `/repos/${OWNER_REPO}`;
const MAIN = "main";
const DRAFT = "media/draft";

type Json = Record<string, unknown>;

type Call = { method: string; path: string; body: Json | undefined };

type TreeItem = { path: string; mode: string; type: string; sha: string };

type DirItem = { path: string; sha: string };

type FakeState = {
  /** ветка → sha коммита */
  refs: Record<string, string>;
  /** sha коммита → sha дерева */
  commitTrees: Record<string, string>;
  /** sha дерева → содержимое */
  trees: Record<string, TreeItem[]>;
  /** "ветка:путь" → текст файла */
  files: Record<string, string>;
  /** "ветка:каталог" → файлы каталога */
  dirs: Record<string, DirItem[]>;
  /** Очередь статусов для PATCH refs: так подставляется гонка. */
  patchStatuses?: number[];
};

let calls: Call[];
let state: FakeState;

const blob = (path: string, sha: string): TreeItem => ({
  path,
  mode: "100644",
  type: "blob",
  sha,
});

const mediaJson = (slots: Json) => JSON.stringify({ version: 2, slots }, null, 2) + "\n";

const entry = (slotKey: string, hash: string) => ({
  src: `/media/${slotKey}/${hash}-1200.webp`,
  w: 1200,
  h: 800,
  variants: [
    { w: 600, src: `/media/${slotKey}/${hash}-600.webp` },
    { w: 1200, src: `/media/${slotKey}/${hash}-1200.webp` },
  ],
});

/**
 * Ответ должен выглядеть как настоящий Response: транспорт читает тело через
 * arrayBuffer() внутри дедлайна (server/http/fetchWithDeadline.ts), а не
 * через text() после него.
 */
const reply = (status: number, body?: unknown) => {
  const text = body === undefined ? "" : JSON.stringify(body);
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => text,
    arrayBuffer: async () => new TextEncoder().encode(text).buffer,
  };
};

const installFetch = () => {
  calls = [];
  let blobs = 0;
  let trees = 0;
  let commits = 0;

  vi.stubGlobal("fetch", async (url: unknown, init: unknown) => {
    const options = (init ?? {}) as { method?: string; body?: string };
    const method = options.method ?? "GET";
    const full = String(url).replace("https://api.github.com", "");
    const [path, query = ""] = full.split("?");
    const body = options.body ? (JSON.parse(options.body) as Json) : undefined;
    calls.push({ method, path: full, body });

    const rest = path.startsWith(R) ? path.slice(R.length) : null;
    if (rest === null) return reply(404, { message: "Not Found" });

    // Ссылки веток
    if (rest.startsWith("/git/ref/heads/") && method === "GET") {
      const branch = rest.slice("/git/ref/heads/".length);
      const sha = state.refs[branch];
      return sha
        ? reply(200, { ref: `refs/heads/${branch}`, object: { sha } })
        : reply(404, { message: "Not Found" });
    }

    if (rest.startsWith("/git/refs/heads/") && method === "PATCH") {
      const branch = rest.slice("/git/refs/heads/".length);
      const status = state.patchStatuses?.shift() ?? 200;
      if (status !== 200) {
        return reply(status, { message: "Update is not a fast forward" });
      }
      state.refs[branch] = String(body?.sha);
      return reply(200, { object: { sha: body?.sha } });
    }

    if (rest.startsWith("/git/refs/heads/") && method === "DELETE") {
      const branch = rest.slice("/git/refs/heads/".length);
      if (!state.refs[branch]) return reply(404, { message: "Not Found" });
      delete state.refs[branch];
      return reply(204);
    }

    if (rest === "/git/refs" && method === "POST") {
      const branch = String(body?.ref).replace("refs/heads/", "");
      if (state.refs[branch]) {
        return reply(422, { message: "Reference already exists" });
      }
      state.refs[branch] = String(body?.sha);
      return reply(201, { object: { sha: body?.sha } });
    }

    // Коммиты и деревья
    if (rest.startsWith("/git/commits/") && method === "GET") {
      const sha = rest.slice("/git/commits/".length);
      const tree = state.commitTrees[sha];
      return tree ? reply(200, { sha, tree: { sha: tree } }) : reply(404, { message: "Not Found" });
    }

    if (rest.startsWith("/git/trees/") && method === "GET") {
      const sha = rest.slice("/git/trees/".length);
      const tree = state.trees[sha];
      return tree
        ? reply(200, { sha, tree, truncated: false })
        : reply(404, { message: "Not Found" });
    }

    if (rest === "/git/blobs" && method === "POST") {
      blobs += 1;
      return reply(201, { sha: `blob-${blobs}` });
    }

    if (rest === "/git/trees" && method === "POST") {
      trees += 1;
      return reply(201, { sha: `tree-${trees}` });
    }

    if (rest === "/git/commits" && method === "POST") {
      commits += 1;
      return reply(201, { sha: `commit-${commits}` });
    }

    // Contents: один файл или один каталог
    if (rest.startsWith("/contents/") && method === "GET") {
      const target = rest.slice("/contents/".length);
      const ref = decodeURIComponent(new URLSearchParams(query).get("ref") ?? "");
      const key = `${ref}:${target}`;

      if (state.files[key] !== undefined) {
        return reply(200, {
          type: "file",
          encoding: "base64",
          sha: `file-${target}`,
          path: target,
          content: Buffer.from(state.files[key], "utf8").toString("base64"),
        });
      }
      if (state.dirs[key]) {
        return reply(
          200,
          state.dirs[key].map((item) => ({ type: "file", path: item.path, sha: item.sha }))
        );
      }
      return reply(404, { message: "Not Found" });
    }

    return reply(404, { message: "Not Found" });
  });
};

type TreeEntryBody = {
  path: string;
  mode: string;
  type: string;
  sha?: string | null;
  content?: string;
};

const of = (method: string, suffix: string) =>
  calls.filter((call) => call.method === method && call.path.startsWith(`${R}${suffix}`));

const lastTree = (): { base_tree: string; tree: TreeEntryBody[] } => {
  const call = of("POST", "/git/trees").at(-1);
  if (!call) throw new Error("дерево не создавалось");
  return call.body as unknown as { base_tree: string; tree: TreeEntryBody[] };
};

const lastCommit = (): { message: string; tree: string; parents: string[] } => {
  const call = of("POST", "/git/commits").at(-1);
  if (!call) throw new Error("коммит не создавался");
  return call.body as unknown as { message: string; tree: string; parents: string[] };
};

/**
 * Настройки восстанавливаем поимённо: присваивание undefined в process.env
 * кладёт туда строку "undefined", и следующий файл тестов получил бы токен
 * из этого.
 */
const ENV_KEYS = [
  "GITHUB_TOKEN",
  "GITHUB_REPO",
  "GITHUB_BRANCH",
  "MEDIA_DRAFT_BRANCH",
] as const;

const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];

  process.env.GITHUB_TOKEN = TOKEN;
  process.env.GITHUB_REPO = OWNER_REPO;
  process.env.GITHUB_BRANCH = MAIN;
  process.env.MEDIA_DRAFT_BRANCH = DRAFT;

  state = { refs: {}, commitTrees: {}, trees: {}, files: {}, dirs: {} };
  installFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  for (const key of ENV_KEYS) {
    const value = savedEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

/* ------------------------------------------------------------------ *
 * Состояние черновика
 * ------------------------------------------------------------------ */

describe("getDraftState", () => {
  it("отдаёт пустое состояние, когда ветки черновика ещё нет", async () => {
    state.refs[MAIN] = "main-1";
    state.files[`${MAIN}:content/media.json`] = mediaJson({
      "preloader.1": entry("preloader.1", "aaaa"),
    });

    const draft = await getDraftState();

    expect(draft.exists).toBe(false);
    expect(draft.changedSlots).toEqual([]);
    expect(draft.branch).toBe(DRAFT);
    // Реестр всё равно отдаётся — админке есть что показать до первой правки.
    expect(Object.keys(draft.media.slots)).toEqual(["preloader.1"]);
  });

  it("показывает слоты, которыми черновик отличается от основной ветки", async () => {
    state.refs[MAIN] = "main-1";
    state.refs[DRAFT] = "draft-1";
    state.files[`${MAIN}:content/media.json`] = mediaJson({
      "preloader.1": entry("preloader.1", "aaaa"),
      "hero.1": entry("hero.1", "bbbb"),
    });
    state.files[`${DRAFT}:content/media.json`] = mediaJson({
      "preloader.1": entry("preloader.1", "aaaa"),
      "hero.1": entry("hero.1", "cccc"),
      "hero.2": entry("hero.2", "dddd"),
    });

    const draft = await getDraftState();

    expect(draft.exists).toBe(true);
    expect(draft.changedSlots).toEqual(["hero.1", "hero.2"]);
  });
});

/* ------------------------------------------------------------------ *
 * Сохранение в черновик
 * ------------------------------------------------------------------ */

const newFiles = (slotKey: string) => [
  {
    name: "new1-600.webp",
    path: `media/${slotKey}/new1-600.webp`,
    buffer: Buffer.from("600px"),
  },
  {
    name: "new1-1200.webp",
    path: `media/${slotKey}/new1-1200.webp`,
    buffer: Buffer.from("1200px"),
  },
];

describe("saveToDraft", () => {
  beforeEach(() => {
    state.refs[MAIN] = "main-1";
    state.refs[DRAFT] = "draft-1";
    state.commitTrees["draft-1"] = "draft-tree-1";
    state.files[`${DRAFT}:content/media.json`] = mediaJson({
      "preloader.1": entry("preloader.1", "aaaa"),
      "hero.1": entry("hero.1", "old"),
    });
    state.dirs[`${DRAFT}:public/media/hero.1`] = [
      { path: "public/media/hero.1/old-600.webp", sha: "old-600" },
      { path: "public/media/hero.1/old-1200.webp", sha: "old-1200" },
    ];
  });

  it("делает ровно один коммит и кладёт в дерево новые файлы, реестр и удаление старых вариантов", async () => {
    const fresh = entry("hero.1", "new1");

    const result = await saveToDraft({
      slotKey: "hero.1",
      files: newFiles("hero.1"),
      entry: fresh,
    });

    expect(of("POST", "/git/commits")).toHaveLength(1);
    expect(result.commitSha).toBe("commit-1");
    expect(result.branchCreated).toBe(false);

    const tree = lastTree();
    // Дерево строится поверх головы черновика.
    expect(tree.base_tree).toBe("draft-tree-1");

    const added = tree.tree.filter((item) => typeof item.sha === "string");
    expect(added.map((item) => item.path).sort()).toEqual([
      "public/media/hero.1/new1-1200.webp",
      "public/media/hero.1/new1-600.webp",
    ]);

    // Старые варианты уходят записью с sha: null — иначе public/media
    // растёт на каждой замене.
    const removed = tree.tree.filter((item) => item.sha === null).map((item) => item.path);
    expect(removed.sort()).toEqual([
      "public/media/hero.1/old-1200.webp",
      "public/media/hero.1/old-600.webp",
    ]);
    expect(result.removed.sort()).toEqual(removed.sort());

    const registry = tree.tree.find((item) => item.path === "content/media.json");
    const media = JSON.parse(String(registry?.content)) as {
      slots: Record<string, unknown>;
    };
    expect(media.slots["hero.1"]).toEqual(fresh);
    // Соседние слоты остались на месте.
    expect(media.slots["preloader.1"]).toBeDefined();

    // Ветка переведена на новый коммит.
    expect(state.refs[DRAFT]).toBe("commit-1");
  });

  it("создаёт ветку черновика от головы основной ветки, если её ещё нет", async () => {
    delete state.refs[DRAFT];
    state.commitTrees["main-1"] = "main-tree-1";
    state.files[`${MAIN}:content/media.json`] = mediaJson({
      "hero.1": entry("hero.1", "old"),
    });

    const result = await saveToDraft({
      slotKey: "hero.1",
      files: newFiles("hero.1"),
      entry: entry("hero.1", "new1"),
    });

    expect(result.branchCreated).toBe(true);
    expect(lastTree().base_tree).toBe("main-tree-1");
    expect(lastCommit().parents).toEqual(["main-1"]);
    expect(of("POST", "/git/refs")).toHaveLength(1);
    expect(state.refs[DRAFT]).toBe("commit-1");
  });

  it("не коммитит файл, который лежит вне папки своего слота", async () => {
    await expect(
      saveToDraft({
        slotKey: "hero.1",
        files: [
          { name: "x.webp", path: "../../.github/workflows/x.webp", buffer: Buffer.from("x") },
        ],
        entry: entry("hero.1", "new1"),
      })
    ).rejects.toThrow(/не принадлежит слоту/);

    expect(of("POST", "/git/commits")).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ *
 * Публикация
 * ------------------------------------------------------------------ */

/** Черновик с тремя изменёнными слотами поверх основной ветки. */
const setupPublishable = () => {
  state.refs[MAIN] = "main-9";
  state.refs[DRAFT] = "draft-9";
  state.commitTrees["main-9"] = "main-tree-9";
  state.commitTrees["draft-9"] = "draft-tree-9";

  const baseSlots: Json = {};
  const draftSlots: Json = {};
  const baseTree: TreeItem[] = [blob("content/media.json", "media-main")];
  const draftTree: TreeItem[] = [blob("content/media.json", "media-draft")];

  for (const key of ["hero.1", "hero.2", "hero.3"]) {
    baseSlots[key] = entry(key, "old");
    draftSlots[key] = entry(key, "new");
    baseTree.push(blob(`public/media/${key}/old-1200.webp`, `old-${key}`));
    draftTree.push(blob(`public/media/${key}/new-1200.webp`, `new-${key}`));
  }
  // Файл вне медиа: публикация не должна его трогать.
  baseTree.push(blob("app/page.tsx", "page-main"));
  draftTree.push(blob("app/page.tsx", "page-draft-outdated"));

  state.trees["main-tree-9"] = baseTree;
  state.trees["draft-tree-9"] = draftTree;
  state.files[`${MAIN}:content/media.json`] = mediaJson(baseSlots);
  state.files[`${DRAFT}:content/media.json`] = mediaJson(draftSlots);
};

describe("publishDraft", () => {
  it("собирает дерево поверх головы основной ветки, а не черновика", async () => {
    setupPublishable();

    await publishDraft();

    expect(lastTree().base_tree).toBe("main-tree-9");
    expect(lastCommit().parents).toEqual(["main-9"]);
  });

  it("делает ровно один коммит на три изменённых слота", async () => {
    setupPublishable();

    const result = await publishDraft();

    expect(of("POST", "/git/commits")).toHaveLength(1);
    expect(result.slots).toEqual(["hero.1", "hero.2", "hero.3"]);
    expect(result.commitSha).toBe("commit-1");

    const message = lastCommit().message;
    expect(message).toContain("3 слота");
    for (const key of result.slots) expect(message).toContain(key);
  });

  it("переносит только пути медиа и уносит старые варианты", async () => {
    setupPublishable();

    await publishDraft();
    const tree = lastTree();

    const paths = tree.tree.map((item) => item.path).sort();
    expect(paths.every((path) => path === "content/media.json" || path.startsWith("public/media/"))).toBe(true);
    // Чужой файл из черновика в публикацию не попал.
    expect(paths).not.toContain("app/page.tsx");

    const removed = tree.tree.filter((item) => item.sha === null).map((item) => item.path);
    expect(removed.sort()).toEqual([
      "public/media/hero.1/old-1200.webp",
      "public/media/hero.2/old-1200.webp",
      "public/media/hero.3/old-1200.webp",
    ]);
  });

  it("сбрасывает ветку черновика после удачной публикации", async () => {
    setupPublishable();

    const result = await publishDraft();

    expect(result.draftReset).toBe(true);
    expect(state.refs[DRAFT]).toBeUndefined();
    expect(of("DELETE", "/git/refs/heads/media/draft")).toHaveLength(1);
  });

  it("ничего не коммитит, когда черновика нет", async () => {
    state.refs[MAIN] = "main-9";

    const result = await publishDraft();

    expect(result.commitSha).toBeNull();
    expect(result.slots).toEqual([]);
    expect(of("POST", "/git/commits")).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ *
 * Отмена
 * ------------------------------------------------------------------ */

describe("отмена изменений", () => {
  it("возвращает один слот к состоянию основной ветки, не трогая остальное", async () => {
    state.refs[MAIN] = "main-2";
    state.refs[DRAFT] = "draft-2";
    state.commitTrees["draft-2"] = "draft-tree-2";
    state.files[`${MAIN}:content/media.json`] = mediaJson({
      "hero.1": entry("hero.1", "old"),
      "hero.2": entry("hero.2", "base2"),
    });
    state.files[`${DRAFT}:content/media.json`] = mediaJson({
      "hero.1": entry("hero.1", "new"),
      "hero.2": entry("hero.2", "draft2"),
    });
    state.dirs[`${MAIN}:public/media/hero.1`] = [
      { path: "public/media/hero.1/old-1200.webp", sha: "old-1200" },
    ];
    state.dirs[`${DRAFT}:public/media/hero.1`] = [
      { path: "public/media/hero.1/new-1200.webp", sha: "new-1200" },
    ];

    const result = await discardSlotFromDraft("hero.1");

    expect(result.changed).toBe(true);
    expect(of("POST", "/git/commits")).toHaveLength(1);

    const tree = lastTree();
    expect(tree.base_tree).toBe("draft-tree-2");
    expect(
      tree.tree.find((item) => item.path === "public/media/hero.1/old-1200.webp")?.sha
    ).toBe("old-1200");
    expect(
      tree.tree.find((item) => item.path === "public/media/hero.1/new-1200.webp")?.sha
    ).toBeNull();

    const media = JSON.parse(
      String(tree.tree.find((item) => item.path === "content/media.json")?.content)
    ) as { slots: Record<string, unknown> };
    // Отменённый слот вернулся к основной ветке, соседний остался черновым.
    expect(media.slots["hero.1"]).toEqual(entry("hero.1", "old"));
    expect(media.slots["hero.2"]).toEqual(entry("hero.2", "draft2"));
  });

  it("не коммитит впустую, когда ветки черновика нет", async () => {
    state.refs[MAIN] = "main-2";

    const result = await discardSlotFromDraft("hero.1");

    expect(result).toEqual({ branch: DRAFT, commitSha: null, changed: false });
    expect(of("POST", "/git/commits")).toHaveLength(0);
  });

  it("discardDraft удаляет ветку целиком и не падает, если её уже нет", async () => {
    state.refs[DRAFT] = "draft-3";

    expect(await discardDraft()).toEqual({ deleted: true });
    expect(state.refs[DRAFT]).toBeUndefined();
    expect(await discardDraft()).toEqual({ deleted: false });
  });
});

/* ------------------------------------------------------------------ *
 * Гонки
 * ------------------------------------------------------------------ */

describe("гонка на переводе ветки", () => {
  const setupSave = () => {
    state.refs[MAIN] = "main-1";
    state.refs[DRAFT] = "draft-1";
    state.commitTrees["draft-1"] = "draft-tree-1";
    state.files[`${DRAFT}:content/media.json`] = mediaJson({
      "hero.1": entry("hero.1", "old"),
    });
    state.dirs[`${DRAFT}:public/media/hero.1`] = [];
  };

  it("после 409 перечитывает голову и со второй попытки проходит", async () => {
    // Повтор пишет предупреждение в лог — здесь оно ожидаемо и только мешает
    // читать вывод прогона.
    vi.spyOn(console, "warn").mockImplementation(() => {});
    setupSave();
    state.patchStatuses = [409];

    const result = await saveToDraft({
      slotKey: "hero.1",
      files: newFiles("hero.1"),
      entry: entry("hero.1", "new1"),
    });

    expect(result.commitSha).toBe("commit-2");
    // Голову ветки черновика перечитали заново, а не переиспользовали старую.
    expect(of("GET", "/git/ref/heads/media/draft")).toHaveLength(2);
    expect(of("PATCH", "/git/refs/heads/media/draft")).toHaveLength(2);
    expect(state.refs[DRAFT]).toBe("commit-2");
  });

  it("три неудачные попытки подряд заканчиваются внятной ошибкой, а не тихим успехом", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    setupSave();
    state.patchStatuses = [409, 409, 409];

    await expect(
      saveToDraft({
        slotKey: "hero.1",
        files: newFiles("hero.1"),
        entry: entry("hero.1", "new1"),
      })
    ).rejects.toThrow(/ветка менялась во время записи/);

    expect(of("PATCH", "/git/refs/heads/media/draft")).toHaveLength(3);
    // Ветка осталась там же, где была.
    expect(state.refs[DRAFT]).toBe("draft-1");
  });
});

/* ------------------------------------------------------------------ *
 * Секреты и настройка
 * ------------------------------------------------------------------ */

describe("токен и настройка", () => {
  it("не выпускает токен ни в текст ошибки, ни в лог", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Худший случай: GitHub процитировал заголовок обратно в тексте ответа.
    vi.stubGlobal("fetch", async () =>
      reply(403, { message: `Bad credentials for ${TOKEN}` })
    );

    const thrown = await getDraftState().then(
      () => null,
      (e: unknown) => e as Error
    );

    expect(thrown).toBeInstanceOf(Error);
    const text = `${thrown?.message} ${thrown?.stack ?? ""}`;
    expect(text).not.toContain(TOKEN);
    expect(thrown?.message).toContain("<token>");
    expect(thrown?.message).toMatch(/Contents: write/);

    const logged = [...warn.mock.calls, ...error.mock.calls]
      .flat()
      .map((item) => (item instanceof Error ? item.message : String(item)))
      .join(" ");
    expect(logged).not.toContain(TOKEN);
  });

  it("не пишет токен в лог при повторах", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    state.refs[MAIN] = "main-1";
    state.refs[DRAFT] = "draft-1";
    state.commitTrees["draft-1"] = "draft-tree-1";
    state.files[`${DRAFT}:content/media.json`] = mediaJson({});
    state.dirs[`${DRAFT}:public/media/hero.1`] = [];
    state.patchStatuses = [409, 409, 409];

    await expect(
      saveToDraft({
        slotKey: "hero.1",
        files: newFiles("hero.1"),
        entry: entry("hero.1", "new1"),
      })
    ).rejects.toThrow();

    expect(warn).toHaveBeenCalled();
    const logged = warn.mock.calls.flat().map(String).join(" ");
    expect(logged).not.toContain(TOKEN);
  });

  it("без GITHUB_TOKEN объясняет, чего не хватает", async () => {
    delete process.env.GITHUB_TOKEN;

    await expect(getDraftState()).rejects.toThrow(/GITHUB_TOKEN/);
    await expect(publishDraft()).rejects.toThrow(/Contents: write/);
    // До сети дело не дошло.
    expect(calls).toHaveLength(0);
  });

  it("ругается на GITHUB_REPO не вида owner/name", async () => {
    process.env.GITHUB_REPO = "traumerch";

    await expect(getDraftState()).rejects.toThrow(/owner\/name/);
  });
});
