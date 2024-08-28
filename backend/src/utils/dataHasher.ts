import { createHash } from 'crypto';

export const hashData = (data: string | Buffer, algorithm: string = 'sha256'): string =>
    createHash(algorithm).update(data).digest('hex');
