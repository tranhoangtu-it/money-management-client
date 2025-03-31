import axios from 'axios';
import { Jar, Transaction, TransferRequest } from '../types';

const API_BASE_URL = 'https://localhost:7042/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const jarService = {
    getAll: async (): Promise<Jar[]> => {
        const response = await api.get('/jars');
        return response.data;
    },

    getById: async (id: number): Promise<Jar> => {
        const response = await api.get(`/jars/${id}`);
        return response.data;
    },

    getBalance: async (id: number): Promise<number> => {
        const response = await api.get(`/jars/${id}/balance`);
        return response.data;
    },

    addMoney: async (id: number, amount: number): Promise<Jar> => {
        const response = await api.post(`/jars/${id}/add`, amount);
        return response.data;
    },

    removeMoney: async (id: number, amount: number): Promise<Jar> => {
        const response = await api.post(`/jars/${id}/remove`, amount);
        return response.data;
    },
};

export const transactionService = {
    getAll: async (): Promise<Transaction[]> => {
        const response = await api.get('/transactions');
        return response.data;
    },

    getById: async (id: number): Promise<Transaction> => {
        const response = await api.get(`/transactions/${id}`);
        return response.data;
    },

    create: async (transaction: Transaction): Promise<Transaction> => {
        const response = await api.post('/transactions', transaction);
        return response.data;
    },

    transfer: async (transfer: TransferRequest): Promise<Transaction> => {
        const response = await api.post('/transactions/transfer', null, {
            params: transfer,
        });
        return response.data;
    },

    getByJarId: async (jarId: number): Promise<Transaction[]> => {
        const response = await api.get(`/transactions/jar/${jarId}`);
        return response.data;
    },

    getByDateRange: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
        const response = await api.get('/transactions/daterange', {
            params: { startDate, endDate },
        });
        return response.data;
    },
}; 