/**
 * Shapes returned by the backend auth routes (`internal/httpapi/auth_handler.go`).
 *
 * `slug` is derived server-side from the user's name and is the authoritative
 * value for an expense's `paidBy`. It is typed as `string` — not as a literal
 * union — precisely because the union would be a frontend convenience and the
 * backend is free to return other slugs.
 */
export interface Member {
  id: string;
  name: string;
  email: string;
  slug: string;
}

export interface Couple {
  id: string;
  members: Member[];
}

/** Body of `GET /api/v1/auth/me` (`httpapi.meResponse`). */
export interface Sessao {
  user: Member;
  couple: Couple;
}

/** Body of `POST /api/v1/auth/login` (`httpapi.loginResponse`). */
export interface LoginResponse extends Sessao {
  token: string;
  expiresIn: number;
}
