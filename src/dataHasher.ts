import { createHash } from 'crypto';

export const hashData = (data: string): string => createHash('sha256').update(data).digest('hex');
