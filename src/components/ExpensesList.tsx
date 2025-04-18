import { FC, useState, useMemo } from "react";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, ArrowUp, ArrowDown, Calendar, ChevronDown, ChevronUp } from "lucide-react";

interface Expense {
    id: string;
    comment: string;
    amount: number;
    category: {
        id: string;
        name: string;
    };
    date: string;
}

interface Props {
    expenses: Expense[];
    onDelete: (id: string) => void;
    onUpdate: (expense: Expense) => void;
}

type SortField = 'amount' | 'category' | 'date' | null;
type SortDirection = 'asc' | 'desc';

const ExpensesList: FC<Props> = ({ expenses, onDelete, onUpdate }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedExpense, setEditedExpense] = useState<Expense | null>(null);
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [dateRangeStart, setDateRangeStart] = useState<string>("");
    const [dateRangeEnd, setDateRangeEnd] = useState<string>("");
    const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
    const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Filter expenses by date range and then sort
    const filteredAndSortedExpenses = useMemo(() => {
        // First filter by date range
        let result = expenses;
        
        if (dateRangeStart) {
            const startDate = new Date(dateRangeStart);
            startDate.setHours(0, 0, 0, 0);
            result = result.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate >= startDate;
            });
        }
        
        if (dateRangeEnd) {
            const endDate = new Date(dateRangeEnd);
            endDate.setHours(23, 59, 59, 999);
            result = result.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate <= endDate;
            });
        }

        // Then sort the filtered expenses
        if (!sortField) return result;

        return [...result].sort((a, b) => {
            let compareA, compareB;

            switch (sortField) {
                case 'amount':
                    compareA = a.amount;
                    compareB = b.amount;
                    break;
                case 'category':
                    compareA = a.category?.name?.toLowerCase() || '';
                    compareB = b.category?.name?.toLowerCase() || '';
                    break;
                case 'date':
                    compareA = new Date(a.date).getTime();
                    compareB = new Date(b.date).getTime();
                    break;
                default:
                    return 0;
            }

            if (sortDirection === 'asc') {
                return compareA < compareB ? -1 : compareA > compareB ? 1 : 0;
            } else {
                return compareA > compareB ? -1 : compareA < compareB ? 1 : 0;
            }
        });
    }, [expenses, sortField, sortDirection, dateRangeStart, dateRangeEnd]);

    const totalAmount = useMemo(() => {
        return filteredAndSortedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    }, [filteredAndSortedExpenses]);

    const handleEdit = (expense: Expense) => {
        setEditingId(expense.id);
        setEditedExpense(expense);
        setExpandedExpenseId(expense.id); // Ensure the expense is expanded when editing on mobile
    };

    const handleSave = () => {
        if (editedExpense) {
            onUpdate(editedExpense);
            setEditingId(null);
            setEditedExpense(null);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditedExpense(null);
    };

    const handleClearDateRange = () => {
        setDateRangeStart("");
        setDateRangeEnd("");
    };

    const toggleExpand = (id: string) => {
        setExpandedExpenseId(expandedExpenseId === id ? null : id);
    };

    // Set date range shortcuts
    const setThisMonth = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        setDateRangeStart(firstDay.toISOString().split('T')[0]);
        setDateRangeEnd(lastDay.toISOString().split('T')[0]);
    };

    const setLastMonth = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        
        setDateRangeStart(firstDay.toISOString().split('T')[0]);
        setDateRangeEnd(lastDay.toISOString().split('T')[0]);
    };

    const setLastThreeMonths = () => {
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        setDateRangeStart(threeMonthsAgo.toISOString().split('T')[0]);
        setDateRangeEnd(lastDay.toISOString().split('T')[0]);
    };

    const setThisYear = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), 0, 1);
        const lastDay = new Date(now.getFullYear(), 11, 31);
        
        setDateRangeStart(firstDay.toISOString().split('T')[0]);
        setDateRangeEnd(lastDay.toISOString().split('T')[0]);
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
        return sortDirection === 'asc' ? 
            <ArrowUp className="w-4 h-4 ml-1" /> : 
            <ArrowDown className="w-4 h-4 ml-1" />;
    };

    return (
        <div>
            {/* Filter Card with Toggle for Mobile */}
            <Card className="shadow-md mb-4">
                <CardContent className="p-4">
                    <div 
                        className="flex justify-between items-center cursor-pointer md:cursor-default"
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                    >
                        <h3 className="text-lg font-semibold flex items-center">
                            <Calendar className="mr-2 h-5 w-5" />
                            Date Range Filter
                        </h3>
                        <div className="md:hidden">
                            {showFilterPanel ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                    </div>
                    
                    <div className={`mt-4 ${showFilterPanel ? 'block' : 'hidden md:block'}`}>
                        <div className="flex flex-col md:flex-row flex-wrap gap-4 md:items-end">
                            <div className="flex flex-col space-y-1">
                                <label htmlFor="start-date" className="text-sm font-medium">
                                    From
                                </label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={dateRangeStart}
                                    onChange={(e) => setDateRangeStart(e.target.value)}
                                    className="w-full md:w-40"
                                />
                            </div>
                            
                            <div className="flex flex-col space-y-1">
                                <label htmlFor="end-date" className="text-sm font-medium">
                                    To
                                </label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={dateRangeEnd}
                                    onChange={(e) => setDateRangeEnd(e.target.value)}
                                    className="w-full md:w-40"
                                />
                            </div>
                            
                            <Button 
                                variant="outline" 
                                onClick={handleClearDateRange}
                                className="mt-2 md:mt-0 md:ml-2"
                            >
                                Clear
                            </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-4">
                            <Button size="sm" variant="secondary" onClick={setThisMonth}>
                                This Month
                            </Button>
                            <Button size="sm" variant="secondary" onClick={setLastMonth}>
                                Last Month
                            </Button>
                            <Button size="sm" variant="secondary" onClick={setLastThreeMonths}>
                                Last 3 Months
                            </Button>
                            <Button size="sm" variant="secondary" onClick={setThisYear}>
                                This Year
                            </Button>
                        </div>
                        
                        {(dateRangeStart || dateRangeEnd) && (
                            <div className="mt-4 text-sm text-gray-500">
                                Showing expenses 
                                {dateRangeStart ? ` from ${new Date(dateRangeStart).toLocaleDateString('en-GB')}` : ''} 
                                {dateRangeEnd ? ` to ${new Date(dateRangeEnd).toLocaleDateString('en-GB')}` : ''}
                                {` (${filteredAndSortedExpenses.length} expense${filteredAndSortedExpenses.length !== 1 ? 's' : ''})`}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden md:block">
                <Card className="shadow-md">
                    <CardContent className="p-4">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-2 px-4 text-left">Comment</th>
                                    <th 
                                        className="py-2 px-4 text-left cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('amount')}
                                    >
                                        <div className="flex items-center">
                                            Amount
                                            {getSortIcon('amount')}
                                        </div>
                                    </th>
                                    <th 
                                        className="py-2 px-4 text-left cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('category')}
                                    >
                                        <div className="flex items-center">
                                            Category
                                            {getSortIcon('category')}
                                        </div>
                                    </th>
                                    <th 
                                        className="py-2 px-4 text-left cursor-pointer hover:bg-gray-200"
                                        onClick={() => handleSort('date')}
                                    >
                                        <div className="flex items-center">
                                            Date
                                            {getSortIcon('date')}
                                        </div>
                                    </th>
                                    <th className="py-2 px-4 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedExpenses.length > 0 ? (
                                    <>
                                        {filteredAndSortedExpenses.map((expense) => (
                                            <tr key={expense.id} className="border-b">
                                                <td className="py-2 px-4">
                                                    {editingId === expense.id ? (
                                                        <Input
                                                            value={editedExpense?.comment}
                                                            onChange={(e) => 
                                                                setEditedExpense(prev => 
                                                                    prev ? {...prev, comment: e.target.value} : prev
                                                                )
                                                            }
                                                        />
                                                    ) : (
                                                        expense.comment
                                                    )}
                                                </td>
                                                <td className="py-2 px-4">
                                                    {editingId === expense.id ? (
                                                        <Input
                                                            type="number"
                                                            value={editedExpense?.amount}
                                                            onChange={(e) => 
                                                                setEditedExpense(prev => 
                                                                    prev ? {...prev, amount: parseFloat(e.target.value)} : prev
                                                                )
                                                            }
                                                        />
                                                    ) : (
                                                        Number.isInteger(expense.amount) ? expense.amount.toString() : expense.amount.toFixed(2)
                                                    )}
                                                </td>
                                                <td className="py-2 px-4">{expense.category?.name || 'N/A'}</td>
                                                <td className="py-2 px-4">
                                                    {editingId === expense.id ? (
                                                        <Input
                                                            type="date"
                                                            value={editedExpense?.date.split('T')[0]}
                                                            onChange={(e) => 
                                                                setEditedExpense(prev => 
                                                                    prev ? {...prev, date: e.target.value} : prev
                                                                )
                                                            }
                                                        />
                                                    ) : (
                                                        new Date(expense.date).toLocaleDateString('en-GB')
                                                    )}
                                                </td>
                                                <td className="py-2 px-4 flex gap-2">
                                                    {editingId === expense.id ? (
                                                        <>
                                                            <Button
                                                                variant="default"
                                                                onClick={handleSave}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={handleCancel}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => handleEdit(expense)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => onDelete(expense.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-500">
                                            No expenses found {dateRangeStart || dateRangeEnd ? 'in the selected date range' : ''}
                                        </td>
                                    </tr>
                                )}
                                <tr className="bg-gray-50 font-semibold">
                                    <td className="py-3 px-4">Total</td>
                                    <td className="py-3 px-4">{Number.isInteger(totalAmount) ? totalAmount.toString() : totalAmount.toFixed(2)}</td>
                                    <td colSpan={3}></td>
                                </tr>
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            {/* Mobile Card View (Hidden on Desktop) */}
            <div className="md:hidden">
                <div className="flex justify-between items-center mb-2 px-2">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Sort by:</span>
                        <Button 
                            size="sm" 
                            variant={sortField === 'date' ? "default" : "outline"} 
                            onClick={() => handleSort('date')}
                            className="text-xs"
                        >
                            Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </Button>
                        <Button 
                            size="sm" 
                            variant={sortField === 'amount' ? "default" : "outline"} 
                            onClick={() => handleSort('amount')}
                            className="text-xs"
                        >
                            Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </Button>
                        <Button 
                            size="sm" 
                            variant={sortField === 'category' ? "default" : "outline"} 
                            onClick={() => handleSort('category')}
                            className="text-xs"
                        >
                            Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </Button>
                    </div>
                </div>

                {filteredAndSortedExpenses.length > 0 ? (
                    <>
                        {filteredAndSortedExpenses.map((expense) => (
                            <Card key={expense.id} className="mb-3 shadow-sm">
                                <CardContent className="p-3">
                                    <div 
                                        className="flex justify-between items-center cursor-pointer"
                                        onClick={() => editingId !== expense.id && toggleExpand(expense.id)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <div className="font-medium truncate mr-2" style={{ maxWidth: '60%' }}>
                                                    {expense.comment}
                                                </div>
                                                <div className="font-bold">
                                                    {Number.isInteger(expense.amount) ? expense.amount.toString() : expense.amount.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-sm text-gray-500 mt-1">
                                                <div>{expense.category?.name || 'N/A'}</div>
                                                <div>{new Date(expense.date).toLocaleDateString('en-GB')}</div>
                                            </div>
                                        </div>
                                        {editingId !== expense.id && (
                                            <div className="ml-2">
                                                {expandedExpenseId === expense.id ? 
                                                    <ChevronUp size={20} /> : 
                                                    <ChevronDown size={20} />
                                                }
                                            </div>
                                        )}
                                    </div>

                                    {/* Expanded section or edit form */}
                                    {(expandedExpenseId === expense.id || editingId === expense.id) && (
                                        <div className="mt-4 border-t pt-4">
                                            {editingId === expense.id ? (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Comment</label>
                                                        <Input
                                                            value={editedExpense?.comment}
                                                            onChange={(e) => 
                                                                setEditedExpense(prev => 
                                                                    prev ? {...prev, comment: e.target.value} : prev
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Amount</label>
                                                        <Input
                                                            type="number"
                                                            value={editedExpense?.amount}
                                                            onChange={(e) => 
                                                                setEditedExpense(prev => 
                                                                    prev ? {...prev, amount: parseFloat(e.target.value)} : prev
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1">Date</label>
                                                        <Input
                                                            type="date"
                                                            value={editedExpense?.date.split('T')[0]}
                                                            onChange={(e) => 
                                                                setEditedExpense(prev => 
                                                                    prev ? {...prev, date: e.target.value} : prev
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <Button
                                                            variant="default"
                                                            onClick={handleSave}
                                                            className="flex-1"
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={handleCancel}
                                                            className="flex-1"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleEdit(expense)}
                                                        className="flex-1"
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => onDelete(expense.id)}
                                                        className="flex-1"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </>
                ) : (
                    <Card className="shadow-md">
                        <CardContent className="py-8 text-center text-gray-500">
                            No expenses found {dateRangeStart || dateRangeEnd ? 'in the selected date range' : ''}
                        </CardContent>
                    </Card>
                )}

                {/* Total Amount Summary for Mobile */}
                <Card className="mt-4 shadow-md">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                            <div className="font-semibold text-lg">Total</div>
                            <div className="font-semibold text-lg">
                                {Number.isInteger(totalAmount) ? totalAmount.toString() : totalAmount.toFixed(2)}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ExpensesList;