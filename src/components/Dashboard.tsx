import React, { useEffect, useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    CircularProgress,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ToggleButtonGroup,
    ToggleButton,
    Grid,
} from '@mui/material';
import { Refresh as RefreshIcon, Add as AddIcon, Remove as RemoveIcon, SwapHoriz as SwapHorizIcon } from '@mui/icons-material';
import { PieChart, LineChart, BarChart } from '@mui/x-charts';
import { Jar, Transaction, TransferRequest } from '../types';
import { jarService, transactionService } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const Dashboard: React.FC = () => {
    const [jars, setJars] = useState<Jar[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedJar, setSelectedJar] = useState<Jar | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [amount, setAmount] = useState('');
    const [isAdding, setIsAdding] = useState(true);
    const [timeRange, setTimeRange] = useState('7');
    const [selectedJarsForChart, setSelectedJarsForChart] = useState<number[]>([]);
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [viewMode, setViewMode] = useState<'absolute' | 'percentage'>('absolute');
    const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
    const [transactionAmount, setTransactionAmount] = useState('');
    const [sourceJarId, setSourceJarId] = useState<number | ''>('');
    const [destinationJarId, setDestinationJarId] = useState<number | ''>('');

    const fetchData = async () => {
        try {
            const [jarsData, transactionsData] = await Promise.all([
                jarService.getAll(),
                transactionService.getAll(),
            ]);
            setJars(jarsData);
            setRecentTransactions(transactionsData.slice(0, 5));
            // Initialize selected jars for chart with all jar IDs
            setSelectedJarsForChart(jarsData.map(jar => jar.id));
        } catch (err) {
            setError('Failed to fetch data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenDialog = (jar: Jar, adding: boolean) => {
        setSelectedJar(jar);
        setIsAdding(adding);
        setAmount('');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedJar(null);
        setAmount('');
    };

    const handleSubmit = async () => {
        if (!selectedJar) return;

        try {
            if (isAdding) {
                await jarService.addMoney(selectedJar.id, parseFloat(amount));
            } else {
                await jarService.removeMoney(selectedJar.id, parseFloat(amount));
            }
            fetchData();
            handleCloseDialog();
        } catch (err) {
            setError(`Failed to ${isAdding ? 'add' : 'remove'} money`);
            console.error(err);
        }
    };

    const handleTimeRangeChange = (event: any) => {
        setTimeRange(event.target.value);
    };

    const handleJarSelectionChange = (event: any) => {
        setSelectedJarsForChart(event.target.value);
    };

    const handleChartTypeChange = (event: React.MouseEvent<HTMLElement>, newType: 'line' | 'bar') => {
        if (newType !== null) {
            setChartType(newType);
        }
    };

    const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'absolute' | 'percentage') => {
        if (newMode !== null) {
            setViewMode(newMode);
        }
    };

    const generateHistoricalData = () => {
        const days = parseInt(timeRange);
        const data = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayData: any = {
                date: date.toLocaleDateString(),
            };

            let total = 0;
            jars.forEach(jar => {
                if (selectedJarsForChart.includes(jar.id)) {
                    const randomFactor = 0.8 + Math.random() * 0.4;
                    const value = jar.currentBalance * randomFactor;
                    dayData[jar.name] = value;
                    total += value;
                }
            });

            // Calculate percentages
            jars.forEach(jar => {
                if (selectedJarsForChart.includes(jar.id)) {
                    dayData[`${jar.name} %`] = ((dayData[jar.name] / total) * 100).toFixed(1);
                }
            });

            data.push(dayData);
        }

        return data;
    };

    const renderChart = () => {
        const data = generateHistoricalData();
        const selectedJars = jars.filter(jar => selectedJarsForChart.includes(jar.id));

        const commonProps = {
            series: selectedJars.map((jar, index) => ({
                dataKey: viewMode === 'absolute' ? jar.name : `${jar.name} %`,
                label: jar.name,
                color: COLORS[index % COLORS.length],
                valueFormatter: (value: number | null) => 
                    value === null ? '' : (viewMode === 'absolute' ? `$${value.toFixed(2)}` : `${value}%`)
            })),
            xAxis: [{ dataKey: 'date', label: 'Date' }],
            yAxis: [{ label: viewMode === 'absolute' ? 'Amount ($)' : 'Percentage (%)' }],
            height: 300,
        };

        switch (chartType) {
            case 'line':
                return (
                    <LineChart
                        {...commonProps}
                        dataset={data}
                    />
                );
            case 'bar':
                return (
                    <BarChart
                        {...commonProps}
                        dataset={data}
                    />
                );
            default:
                return (
                    <LineChart
                        {...commonProps}
                        dataset={data}
                    />
                );
        }
    };

    const handleOpenTransactionDialog = () => {
        setOpenTransactionDialog(true);
        setTransactionAmount('');
        setSourceJarId('');
        setDestinationJarId('');
    };

    const handleCloseTransactionDialog = () => {
        setOpenTransactionDialog(false);
        setTransactionAmount('');
        setSourceJarId('');
        setDestinationJarId('');
    };

    const handleTransactionSubmit = async () => {
        if (!sourceJarId || !destinationJarId || !transactionAmount) return;

        try {
            const transferRequest: TransferRequest = {
                sourceJarId: sourceJarId as number,
                destinationJarId: destinationJarId as number,
                amount: parseFloat(transactionAmount),
                description: `Transfer from ${jars.find(j => j.id === sourceJarId)?.name} to ${jars.find(j => j.id === destinationJarId)?.name}`,
            };
            await transactionService.transfer(transferRequest);
            fetchData();
            handleCloseTransactionDialog();
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

    const totalBalance = jars.reduce((sum, jar) => sum + jar.currentBalance, 0);
    const chartData = jars.map((jar) => ({
        id: jar.id,
        value: jar.currentBalance,
        label: jar.name,
    }));

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Dashboard</Typography>
                <Box>
                    <Tooltip title="New Transaction">
                        <IconButton onClick={handleOpenTransactionDialog} color="primary" sx={{ mr: 1 }}>
                            <SwapHorizIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh data">
                        <IconButton onClick={fetchData} color="primary">
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                }}
            >
                <Paper sx={{ p: 3, flex: '1 1 100%' }}>
                    <Typography variant="h6" gutterBottom>
                        Total Balance
                    </Typography>
                    <Typography variant="h4" color="primary">
                        ${totalBalance.toFixed(2)}
                    </Typography>
                </Paper>

                <Paper sx={{ p: 3, flex: '1 1 100%', height: 300 }}>
                    <Typography variant="h6" gutterBottom>
                        Money Distribution
                    </Typography>
                    <PieChart
                        series={[{
                            data: chartData,
                            valueFormatter: (value: any) => `$${value.toFixed(2)}`,
                        }]}
                        colors={COLORS}
                        height={300}
                        width={300}
                    />
                </Paper>

                <Paper sx={{ p: 3, flex: '1 1 100%', height: 400 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Balance History</Typography>
                        <Box display="flex" gap={2} alignItems="center">
                            <ToggleButtonGroup
                                value={chartType}
                                exclusive
                                onChange={handleChartTypeChange}
                                size="small"
                            >
                                <ToggleButton value="line">Line</ToggleButton>
                                <ToggleButton value="bar">Bar</ToggleButton>
                            </ToggleButtonGroup>
                            <ToggleButtonGroup
                                value={viewMode}
                                exclusive
                                onChange={handleViewModeChange}
                                size="small"
                            >
                                <ToggleButton value="absolute">Amount</ToggleButton>
                                <ToggleButton value="percentage">Percentage</ToggleButton>
                            </ToggleButtonGroup>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Time Range</InputLabel>
                                <Select
                                    value={timeRange}
                                    label="Time Range"
                                    onChange={handleTimeRangeChange}
                                >
                                    <MenuItem value="7">7 Days</MenuItem>
                                    <MenuItem value="30">30 Days</MenuItem>
                                    <MenuItem value="90">90 Days</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Select Jars</InputLabel>
                                <Select
                                    multiple
                                    value={selectedJarsForChart}
                                    label="Select Jars"
                                    onChange={handleJarSelectionChange}
                                >
                                    {jars.map((jar) => (
                                        <MenuItem key={jar.id} value={jar.id}>
                                            {jar.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                    {renderChart()}
                </Paper>

                {jars.map((jar) => (
                    <Box
                        key={jar.id}
                        sx={{
                            flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 16px)' },
                            minWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' },
                        }}
                    >
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                {jar.name}
                            </Typography>
                            <Typography color="textSecondary" gutterBottom>
                                {jar.description}
                            </Typography>
                            <Typography variant="subtitle1" gutterBottom>
                                Percentage: {jar.percentage}%
                            </Typography>
                            <Typography variant="h5" color="primary" gutterBottom>
                                ${jar.currentBalance.toFixed(2)}
                            </Typography>
                            <Box display="flex" gap={1}>
                                <Tooltip title="Add money">
                                    <IconButton
                                        color="primary"
                                        onClick={() => handleOpenDialog(jar, true)}
                                    >
                                        <AddIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove money">
                                    <IconButton
                                        color="error"
                                        onClick={() => handleOpenDialog(jar, false)}
                                    >
                                        <RemoveIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Paper>
                    </Box>
                ))}

                <Paper sx={{ p: 3, flex: '1 1 100%' }}>
                    <Typography variant="h6" gutterBottom>
                        Recent Transactions
                    </Typography>
                    {recentTransactions.map((transaction) => (
                        <Box
                            key={transaction.id}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                py: 1,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Box>
                                <Typography variant="subtitle1">
                                    {transaction.sourceJar?.name} → {transaction.destinationJar?.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {new Date(transaction.transactionDate).toLocaleDateString()}
                                </Typography>
                            </Box>
                            <Typography
                                variant="subtitle1"
                                color={transaction.amount >= 0 ? 'primary' : 'error'}
                            >
                                ${Math.abs(transaction.amount).toFixed(2)}
                            </Typography>
                        </Box>
                    ))}
                </Paper>
            </Box>

            <Dialog open={openTransactionDialog} onClose={handleCloseTransactionDialog} maxWidth="sm" fullWidth>
                <DialogTitle>New Transaction</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>From Jar</InputLabel>
                            <Select
                                value={sourceJarId}
                                label="From Jar"
                                onChange={(e) => setSourceJarId(e.target.value as number)}
                            >
                                {jars.map((jar) => (
                                    <MenuItem key={jar.id} value={jar.id}>
                                        {jar.name} (${jar.currentBalance.toFixed(2)})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>To Jar</InputLabel>
                            <Select
                                value={destinationJarId}
                                label="To Jar"
                                onChange={(e) => setDestinationJarId(e.target.value as number)}
                            >
                                {jars.map((jar) => (
                                    <MenuItem key={jar.id} value={jar.id}>
                                        {jar.name} (${jar.currentBalance.toFixed(2)})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Amount"
                            type="number"
                            value={transactionAmount}
                            onChange={(e) => setTransactionAmount(e.target.value)}
                            InputProps={{
                                startAdornment: '$',
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseTransactionDialog}>Cancel</Button>
                    <Button 
                        onClick={handleTransactionSubmit} 
                        variant="contained" 
                        color="primary"
                        disabled={!sourceJarId || !destinationJarId || !transactionAmount}
                    >
                        Transfer
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>
                    {isAdding ? 'Add Money' : 'Remove Money'} - {selectedJar?.name}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Amount"
                        type="number"
                        fullWidth
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color={isAdding ? 'primary' : 'error'}>
                        {isAdding ? 'Add' : 'Remove'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 