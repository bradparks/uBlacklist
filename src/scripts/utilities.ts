import dayjs from 'dayjs';
import { ErrorResult, Result, SuccessResult } from './types';

export class AltURL {
  scheme: string;
  host: string;
  path: string;

  constructor(url: string) {
    const u = new URL(url);
    this.scheme = u.protocol.slice(0, -1);
    this.host = u.hostname;
    this.path = `${u.pathname}${u.search}`;
  }

  toString(): string {
    return `${this.scheme}://${this.host}${this.path}`;
  }
}

export class HTTPError extends Error {
  constructor(public status: number, public statusText: string) {
    super(`${status} ${statusText}`);
  }
}

// #region MatchPattern
const enum SchemeMatch {
  Any,
  Exact,
}

const enum HostMatch {
  Any,
  Domain,
  Exact,
}

const enum PathMatch {
  Any,
  Prefix,
  RegExp,
}

export class MatchPattern {
  private schemeMatch: SchemeMatch;
  private scheme?: string;
  private hostMatch: HostMatch;
  private host?: string;
  private pathMatch: PathMatch;
  private path?: string | RegExp;

  constructor(mp: string) {
    const m = /^(\*|https?|ftp):\/\/(\*|(?:\*\.)?[^/*]+)(\/.*)$/.exec(mp);
    if (!m) {
      throw new Error('Invalid match pattern');
    }
    const [, scheme, host, path] = m;
    if (scheme === '*') {
      this.schemeMatch = SchemeMatch.Any;
    } else {
      this.schemeMatch = SchemeMatch.Exact;
      this.scheme = scheme;
    }
    if (host === '*') {
      this.hostMatch = HostMatch.Any;
    } else if (host.startsWith('*.')) {
      this.hostMatch = HostMatch.Domain;
      this.host = host.slice(2);
    } else {
      this.hostMatch = HostMatch.Exact;
      this.host = host;
    }
    if (path === '/*') {
      this.pathMatch = PathMatch.Any;
    } else if (path.indexOf('*') === path.length - 1) {
      this.pathMatch = PathMatch.Prefix;
      this.path = path.slice(0, -1);
    } else {
      this.pathMatch = PathMatch.RegExp;
      this.path = new RegExp(
        `^${path.replace(/[$^\\.+?()[\]{}|]/g, '\\$&').replace(/\*/g, '.*')}$`,
      );
    }
  }

  test(url: AltURL): boolean {
    if (this.hostMatch === HostMatch.Domain) {
      if (url.host !== this.host! && !url.host.endsWith(`.${this.host!}`)) {
        return false;
      }
    } else if (this.hostMatch === HostMatch.Exact) {
      if (url.host !== this.host!) {
        return false;
      }
    }
    if (this.schemeMatch === SchemeMatch.Any) {
      if (url.scheme !== 'http' && url.scheme !== 'https') {
        return false;
      }
    } else {
      if (url.scheme !== this.scheme!) {
        return false;
      }
    }
    if (this.pathMatch === PathMatch.Prefix) {
      if (!url.path.startsWith(this.path as string)) {
        return false;
      }
    } else if (this.pathMatch === PathMatch.RegExp) {
      if (!(this.path as RegExp).test(url.path)) {
        return false;
      }
    }
    return true;
  }
}
// #endregion MatchPattern

export class Mutex {
  private queue: (() => Promise<void>)[] = [];

  lock<T>(func: () => T | Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await Promise.resolve(func()));
        } catch (e) {
          reject(e);
        }
      });
      if (this.queue.length === 1) {
        this.dequeue();
      }
    });
  }

  private async dequeue(): Promise<void> {
    if (!this.queue.length) {
      return;
    }
    await this.queue[0]();
    this.queue.shift();
    this.dequeue();
  }
}

// #region Result
export function isErrorResult(result: Result): result is ErrorResult {
  return result.type === 'error';
}

export function isSuccessResult(result: Result): result is SuccessResult {
  return result.type === 'success';
}

export function errorResult(message: string): ErrorResult {
  return {
    type: 'error',
    message,
  };
}

export function successResult(): SuccessResult {
  return {
    type: 'success',
    timestamp: dayjs().toISOString(),
  };
}
// #endregion Result

// #region string
export function escapeHTML(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function lines(s: string): string[] {
  return s ? s.split('\n') : [];
}

export function unlines(ss: string[]): string {
  return ss.join('\n');
}
// #endregion string
