import { hashData } from '../utils/dataHasher';

describe('dataHasher', () => {
    it('should generate a consistent hash for the same input', () => {
        const input = 'test data';
        const hash1 = hashData(input);
        const hash2 = hashData(input);
        expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
        const input1 = 'test data 1';
        const input2 = 'test data 2';
        const hash1 = hashData(input1);
        const hash2 = hashData(input2);
        expect(hash1).not.toBe(hash2);
    });

    it('should generate a hash of the correct length', () => {
        const input = 'test data';
        const hash = hashData(input);
        expect(hash).toHaveLength(64); // SHA-256 produces a 64-character hexadecimal string
    });
});
