export type Result<T, E = Error> =
    | { ok: true; value: T }
    | { ok: false; error: E };

export const ok = <T, E>(value: T): Result<T, E> => ({ ok: true, value })
export const err = <T, E>(error: E): Result<T, E> => ({ ok: false, error })

// separate the oks and errs into two separate lists
export const unzip = <T, E = Error>(l: Result<T, E>[]): [T[], E[]] => {
    const oks = [];
    const errs = [];

    for (const res of l) {
        if (res.ok) {
            oks.push(res.value);
        } else {
            errs.push(res.error);
        }
    }

    return [oks, errs]
} 