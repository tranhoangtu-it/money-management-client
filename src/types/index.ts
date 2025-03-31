export interface Jar {
    id: number;
    name: string;
    percentage: number;
    description: string;
    currentBalance: number;
    createdAt: string;
    updatedAt?: string;
}

export interface Transaction {
    id: number;
    sourceJarId: number;
    destinationJarId: number;
    amount: number;
    description: string;
    transactionDate: string;
    createdAt: string;
    updatedAt?: string;
    sourceJar?: Jar;
    destinationJar?: Jar;
}

export interface TransferRequest {
    sourceJarId: number;
    destinationJarId: number;
    amount: number;
    description: string;
} 