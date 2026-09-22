"use client";

import { useState, type FormEvent } from "react";

import styles from "./login.module.css";

/**
 * Форма входа в админку.
 *
 * Пароль нигде не сохраняется: он живёт только в состоянии поля до отправки и
 * стирается сразу после ответа сервера. Ни localStorage, ни куки на клиенте —
 * куку ставит сервер, она HttpOnly и из JS не читается.
 *
 * Текст ошибки берётся из ответа: сервер уже различает неверный пароль,
 * перебор и ненастроенные переменные окружения, и подменять это общим
 * «что-то пошло не так» значит заставлять разбираться по логам.
 */
export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      setPassword("");

      if (response.ok) {
        // Полная перезагрузка, а не клиентский переход: так запрос к /admin
        // уходит уже с новой кукой и проходит через middleware обычным путём.
        window.location.assign("/admin");
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        error?: unknown;
      } | null;

      setError(
        typeof data?.error === "string"
          ? data.error
          : `Не удалось войти (код ${response.status}).`
      );
    } catch {
      setError("Сервер не ответил. Проверьте соединение и попробуйте снова.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Админка фотографий</h1>
        <p className={styles.subtitle}>Введите пароль, чтобы продолжить.</p>

        <label className={styles.label} htmlFor="admin-password">
          Пароль
        </label>
        <input
          id="admin-password"
          className={styles.input}
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={pending}
          autoFocus
        />

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <button
          className={styles.button}
          type="submit"
          disabled={pending || !password}
        >
          {pending ? "Проверяем…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
