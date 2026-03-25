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
    const url = `https://rdap.org/domain/${domain}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

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
