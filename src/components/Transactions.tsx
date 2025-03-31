import React, { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    CircularProgress,
} from '@mui/material';
import { Transaction, Jar } from '../types';
import { transactionService, jarService } from '../services/api';

export const Transactions: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [jars, setJars] = useState<Jar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        sourceJarId: '',
        destinationJarId: '',
        amount: '',
        description: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [transactionsData, jarsData] = await Promise.all([
                    transactionService.getAll(),
                    jarService.getAll(),
                ]);
                setTransactions(transactionsData);
                setJars(jarsData);
            } catch (err) {
                setError('Failed to fetch data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setNewTransaction({
            sourceJarId: '',
            destinationJarId: '',
            amount: '',
            description: '',
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewTransaction((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async () => {
        try {
            const transaction = await transactionService.transfer({
                sourceJarId: parseInt(newTransaction.sourceJarId),
                destinationJarId: parseInt(newTransaction.destinationJarId),
                amount: parseFloat(newTransaction.amount),
                description: newTransaction.description,
            });
            setTransactions((prev) => [transaction, ...prev]);
            handleCloseDialog();
        } catch (err) {
            setError('Failed to create transaction');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Transactions</Typography>
                <Button variant="contained" color="primary" onClick={handleOpenDialog}>
                    New Transaction
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>
                                    {new Date(transaction.transactionDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{transaction.sourceJar?.name}</TableCell>
                                <TableCell>{transaction.destinationJar?.name}</TableCell>
                                <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                                <TableCell>{transaction.description}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>New Transaction</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={2}>
                        <TextField
                            select
                            label="From Jar"
                            name="sourceJarId"
                            value={newTransaction.sourceJarId}
                            onChange={handleInputChange}
                            fullWidth
                        >
                            {jars.map((jar) => (
                                <MenuItem key={jar.id} value={jar.id}>
                                    {jar.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            label="To Jar"
                            name="destinationJarId"
                            value={newTransaction.destinationJarId}
                            onChange={handleInputChange}
                            fullWidth
                        >
                            {jars.map((jar) => (
                                <MenuItem key={jar.id} value={jar.id}>
                                    {jar.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Amount"
                            name="amount"
                            type="number"
                            value={newTransaction.amount}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <TextField
                            label="Description"
                            name="description"
                            value={newTransaction.description}
                            onChange={handleInputChange}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 