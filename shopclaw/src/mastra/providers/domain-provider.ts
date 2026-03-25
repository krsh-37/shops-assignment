import { isDevMode } from '../config/openclaw-config.js';

export type DomainAvailability = {
  domain: string;
  available: boolean;
  status: number;
};

export interface DomainProvider {
  check(domain: string): Promise<DomainAvailability>;
}

class RdapDomainProvider implements DomainProvider {
  async check(domain: string): Promise<DomainAvailability> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const url = `https://rdap.org/domain/${domain}`;
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { domain, available: true, status: 408 };
      }
      return { domain, available: true, status: 0 };
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 404) {
      return { domain, available: true, status: response.status };
    }

    if (response.ok) {
      return { domain, available: false, status: response.status };
    }

    throw new Error(`RDAP lookup failed for ${domain} with status ${response.status}`);
  }
}

class StubDomainProvider implements DomainProvider {
  async check(domain: string): Promise<DomainAvailability> {
    return {
      domain,
      available: !domain.includes('feetsy'),
      status: 200,
    };
  }
}

export function getDomainProvider(): DomainProvider {
  return isDevMode() ? new RdapDomainProvider() : new StubDomainProvider();
}
