import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, Download, 
  Plus, Edit2, Trash2, Upload, FileText, ArrowUpCircle, 
  ArrowDownCircle, Loader2, Filter, RefreshCw
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const categoryColors = {
  inventory: '#10b981',
  rent: '#f59e0b',
  utilities: '#3b82f6',
  payroll: '#8b5cf6',
  marketing: '#ec4899',
  delivery: '#06b6d4',
  licenses: '#84cc16',
  insurance: '#6366f1',
  equipment: '#f97316',
  supplies: '#14b8a6',
  other: '#64748b'
};

export default function FinanceReports() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [dateRange, setDateRange] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-date')
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list()
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsExpenseModalOpen(false);
      setFormData({});
      toast.success('Expense added');
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
      setFormData({});
      toast.success('Expense updated');
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted');
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, receipt_url: file_url }));
      toast.success('Receipt uploaded');
    } catch (error) {
      toast.error('Upload failed');
    }
  };

  const getDateRangeFilter = () => {
    const now = new Date();
    let start, end;

    switch (dateRange) {
      case 'this_month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'this_year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'custom':
        start = customStartDate ? new Date(customStartDate) : new Date(0);
        end = customEndDate ? new Date(customEndDate) : now;
        break;
      default:
        start = new Date(0);
        end = now;
    }

    return { start, end };
  };

  const { filteredExpenses, filteredOrders, totalIncome, totalExpenses, netProfit, categoryBreakdown, monthlyData } = useMemo(() => {
    const { start, end } = getDateRangeFilter();

    const filteredExp = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const inRange = expDate >= start && expDate <= end;
      const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
      return inRange && matchesCategory;
    });

    const filteredOrd = orders.filter(order => {
      const orderDate = new Date(order.created_date);
      return orderDate >= start && orderDate <= end && order.status === 'delivered';
    });

    const income = filteredOrd.reduce((sum, o) => sum + (o.total || 0), 0);
    const expense = filteredExp.reduce((sum, e) => sum + (e.amount || 0), 0);
    const profit = income - expense;

    // Category breakdown
    const catBreakdown = {};
    filteredExp.forEach(exp => {
      const cat = exp.category || 'other';
      catBreakdown[cat] = (catBreakdown[cat] || 0) + exp.amount;
    });

    // Monthly data for charts
    const monthlyMap = {};
    filteredOrd.forEach(order => {
      const month = format(new Date(order.created_date), 'MMM yyyy');
      if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expenses: 0 };
      monthlyMap[month].income += order.total || 0;
    });
    filteredExp.forEach(exp => {
      const month = format(new Date(exp.date), 'MMM yyyy');
      if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expenses: 0 };
      monthlyMap[month].expenses += exp.amount || 0;
    });

    const monthly = Object.keys(monthlyMap).map(month => ({
      month,
      income: monthlyMap[month].income,
      expenses: monthlyMap[month].expenses,
      profit: monthlyMap[month].income - monthlyMap[month].expenses
    }));

    return {
      filteredExpenses: filteredExp,
      filteredOrders: filteredOrd,
      totalIncome: income,
      totalExpenses: expense,
      netProfit: profit,
      categoryBreakdown: Object.entries(catBreakdown).map(([name, value]) => ({ name, value })),
      monthlyData: monthly
    };
  }, [expenses, orders, dateRange, customStartDate, customEndDate, categoryFilter]);

  const handleSaveExpense = () => {
    if (!formData.description || !formData.amount || !formData.date) {
      toast.error('Please fill required fields');
      return;
    }

    const data = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data });
    } else {
      createExpenseMutation.mutate(data);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setFormData(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = (id) => {
    if (confirm('Delete this expense?')) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const handleExportReport = () => {
    const csvRows = [
      ['Type', 'Description', 'Amount', 'Date', 'Category'],
      ...filteredExpenses.map(e => ['Expense', e.description, e.amount, e.date, e.category]),
      ...filteredOrders.map(o => ['Income', `Order #${o.id.slice(0, 8)}`, o.total, format(new Date(o.created_date), 'yyyy-MM-dd'), 'Sales'])
    ];

    const csv = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Report exported');
  };

  const isLoading = loadingExpenses || loadingOrders;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-emerald-900 mb-2">Finance Reports</h1>
            <p className="text-emerald-600">Track income, expenses, and profitability</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportReport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
            <Button onClick={() => { setEditingExpense(null); setFormData({}); setIsExpenseModalOpen(true); }} className="bg-gradient-to-r from-emerald-500 to-green-500 gap-2">
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white/60 backdrop-blur border-emerald-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="this_year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === 'custom' && (
                <>
                  <div className="flex-1 min-w-[150px]">
                    <Label>Start Date</Label>
                    <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <Label>End Date</Label>
                    <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
                  </div>
                </>
              )}

              <div className="flex-1 min-w-[200px]">
                <Label>Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="payroll">Payroll</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="licenses">Licenses</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4" />
                      Total Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">${totalIncome.toFixed(2)}</p>
                    <p className="text-xs text-green-100 mt-1">{filteredOrders.length} orders</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-gradient-to-br from-red-500 to-orange-600 text-white border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4" />
                      Total Expenses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
                    <p className="text-xs text-red-100 mt-1">{filteredExpenses.length} expenses</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-blue-500 to-cyan-600' : 'from-purple-500 to-pink-600'} text-white border-0 shadow-lg`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Net Profit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">${netProfit.toFixed(2)}</p>
                    <p className="text-xs text-blue-100 mt-1">
                      {totalIncome > 0 ? `${((netProfit / totalIncome) * 100).toFixed(1)}% margin` : 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="bg-white/60 backdrop-blur border-emerald-200">
                <CardHeader>
                  <CardTitle>Income vs Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="income" fill="#10b981" name="Income" />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur border-emerald-200">
                <CardHeader>
                  <CardTitle>Expense Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || '#64748b'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Expense List */}
            <Card className="bg-white/60 backdrop-blur border-emerald-200">
              <CardHeader>
                <CardTitle>Expense Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredExpenses.length === 0 ? (
                    <p className="text-center py-8 text-emerald-600">No expenses recorded</p>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-emerald-900">{expense.description}</p>
                            <Badge style={{ backgroundColor: categoryColors[expense.category] || '#64748b' }} className="text-white text-xs">
                              {expense.category}
                            </Badge>
                            {expense.recurring && <Badge variant="outline" className="text-xs">Recurring</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-emerald-600">
                            <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                            {expense.vendor && <span>• {expense.vendor}</span>}
                            {expense.payment_method && <span>• {expense.payment_method}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold text-red-600">-${expense.amount.toFixed(2)}</p>
                          <div className="flex gap-1">
                            {expense.receipt_url && (
                              <Button variant="ghost" size="icon" onClick={() => window.open(expense.receipt_url, '_blank')} className="h-8 w-8">
                                <FileText className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)} className="h-8 w-8">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)} className="h-8 w-8 text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Add/Edit Expense Modal */}
        <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Description *</Label>
                <Input
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Office supplies"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount * ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="100.00"
                  />
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category || 'other'} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="licenses">Licenses</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={formData.payment_method || 'card'} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Vendor/Supplier</Label>
                <Input
                  value={formData.vendor || ''}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="ABC Supplies Inc."
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.recurring || false}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label>Recurring Expense</Label>
              </div>

              {formData.recurring && (
                <div>
                  <Label>Frequency</Label>
                  <Select value={formData.recurring_frequency || 'monthly'} onValueChange={(v) => setFormData({ ...formData, recurring_frequency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Receipt/Invoice</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  {formData.receipt_url && (
                    <Button variant="outline" size="icon" onClick={() => window.open(formData.receipt_url, '_blank')}>
                      <FileText className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsExpenseModalOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleSaveExpense}
                  disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                  className="bg-gradient-to-r from-emerald-500 to-green-500"
                >
                  {(createExpenseMutation.isPending || updateExpenseMutation.isPending) ? 'Saving...' : 'Save Expense'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}