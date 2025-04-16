import React, { useMemo, useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

// Updated to match your detailed expense structure
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

// Type for the expense item in a category
interface CategoryExpenseItem {
    id: string;
    date: string;
    amount: number;
    comment: string;
}

// Type for category with expenses
interface CategoryWithExpenses {
    name: string;
    amount: number;
    percentage: number;
    expenses: CategoryExpenseItem[];
}

interface CurrentMonthExpensesChartProps {
    expenses: Expense[];
}

const CurrentMonthExpensesChart: React.FC<CurrentMonthExpensesChartProps> = ({
    expenses,
}) => {
    // State to track which categories are expanded
    const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
    // State to track whether to include business expenses
    const [includeBusinessExpenses, setIncludeBusinessExpenses] = useState<boolean>(true);

    // Filter expenses to only show current month and process daily sums
    const { dailySums, monthTotal, monthName, categoryExpenses, totalWithoutBusiness } = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Filter for expenses in the current month
        const currentMonthExpenses = expenses.filter((expense) => {
            const expenseDate = new Date(expense.date);
            return (
                expenseDate.getMonth() === currentMonth &&
                expenseDate.getFullYear() === currentYear
            );
        });

        // Calculate total for the month
        const total = currentMonthExpenses.reduce(
            (sum, expense) => sum + expense.amount,
            0
        );

        // Calculate total excluding business expenses
        const nonBusinessTotal = currentMonthExpenses
            .filter(expense => expense.category.name !== "Business")
            .reduce((sum, expense) => sum + expense.amount, 0);

        // Group expenses by day and calculate daily sums (with and without business)
        const dailyMap = new Map<number, { day: number; amount: number; amountWithoutBusiness: number; fullDate: string }>();

        currentMonthExpenses.forEach((expense) => {
            const expenseDate = new Date(expense.date);
            const day = expenseDate.getDate();
            const fullDate = new Date(expense.date).toLocaleDateString("en-GB");
            const amount = expense.amount;
            const isBusinessExpense = expense.category.name === "Business";

            if (dailyMap.has(day)) {
                const existingDay = dailyMap.get(day);
                if (existingDay) {
                    existingDay.amount += amount;
                    if (!isBusinessExpense) {
                        existingDay.amountWithoutBusiness += amount;
                    }
                }
            } else {
                dailyMap.set(day, {
                    day,
                    amount: amount,
                    amountWithoutBusiness: isBusinessExpense ? 0 : amount,
                    fullDate,
                });
            }
        });

        // Convert to array and sort by day
        const result = Array.from(dailyMap.values());
        result.sort((a, b) => a.day - b.day);

        // Group expenses by category and store individual expenses
        const categoryMap = new Map<string, CategoryWithExpenses>();
        
        currentMonthExpenses.forEach((expense) => {
            const categoryName = expense.category.name;
            
            if (categoryMap.has(categoryName)) {
                const category = categoryMap.get(categoryName);
                if (category) {
                    category.amount += expense.amount;
                    category.expenses.push({
                        id: expense.id,
                        date: new Date(expense.date).toLocaleDateString("en-GB"),
                        amount: expense.amount,
                        comment: expense.comment
                    });
                }
            } else {
                categoryMap.set(categoryName, {
                    name: categoryName,
                    amount: expense.amount,
                    percentage: 0, // Will calculate after summing all
                    expenses: [{
                        id: expense.id,
                        date: new Date(expense.date).toLocaleDateString("en-GB"),
                        amount: expense.amount,
                        comment: expense.comment
                    }]
                });
            }
        });
        
        // Calculate percentages and sort by amount (descending)
        const categoryResults: CategoryWithExpenses[] = Array.from(categoryMap.values());
        categoryResults.forEach(category => {
            category.percentage = (category.amount / total) * 100;
            // Sort expenses by date (newest first)
            category.expenses.sort((a: CategoryExpenseItem, b: CategoryExpenseItem) => {
                // Parse dates in DD/MM/YYYY format
                const partsA = a.date.split('/');
                const partsB = b.date.split('/');
                
                // Create date objects (format: day/month/year)
                const dateA = new Date(parseInt(partsA[2]), parseInt(partsA[1]) - 1, parseInt(partsA[0]));
                const dateB = new Date(parseInt(partsB[2]), parseInt(partsB[1]) - 1, parseInt(partsB[0]));
                
                // Sort in descending order (newest first)
                return dateB.getTime() - dateA.getTime();
            });
        });
        
        categoryResults.sort((a, b) => b.amount - a.amount);

        // Get the month name
        const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];

        return {
            dailySums: result,
            monthTotal: total,
            monthName: monthNames[currentMonth],
            categoryExpenses: categoryResults,
            totalWithoutBusiness: nonBusinessTotal
        };
    }, [expenses]);

    // Format number for display
    const formatNumber = (value: number): string => {
        return Number.isInteger(value) ? value.toString() : value.toFixed(2);
    };

    // Toggle which data to display based on includeBusinessExpenses state
    const displayData = useMemo(() => {
        if (includeBusinessExpenses) {
            return dailySums.map(item => ({
                day: item.day,
                amount: item.amount,
                fullDate: item.fullDate
            }));
        } else {
            return dailySums.map(item => ({
                day: item.day,
                amount: item.amountWithoutBusiness,
                fullDate: item.fullDate
            }));
        }
    }, [dailySums, includeBusinessExpenses]);

    // Filter categories if not including business and recalculate percentages
    const displayCategories = useMemo(() => {
        if (includeBusinessExpenses) {
            return categoryExpenses;
        } else {
            // Filter out Business category and create deep copies to avoid mutating original data
            const filteredCategories = categoryExpenses
                .filter(category => category.name !== "Business")
                .map(category => ({
                    ...category,
                    // Create a new percentage calculated against the non-business total
                    percentage: totalWithoutBusiness > 0 
                        ? (category.amount / totalWithoutBusiness) * 100 
                        : 0,
                    // Create a deep copy of expenses array to avoid mutation
                    expenses: [...category.expenses]
                }));
            
            return filteredCategories;
        }
    }, [categoryExpenses, includeBusinessExpenses, totalWithoutBusiness]);

    return (
        <Card className="shadow-md">
            <CardContent className="p-4">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="text-xl font-semibold">
                        {monthName} Daily Expenses
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="text-lg">
                            Total:{" "}
                            {formatNumber(includeBusinessExpenses ? monthTotal : totalWithoutBusiness)}
                            {!includeBusinessExpenses && (
                                <span className="text-sm ml-2 text-gray-500">
                                    (excluding business expenses)
                                </span>
                            )}
                        </div>
                        <div className="flex items-center">
                            <label className="inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={includeBusinessExpenses}
                                    onChange={() => setIncludeBusinessExpenses(!includeBusinessExpenses)}
                                    className="sr-only peer"
                                />
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                <span className="ms-3 text-sm font-medium text-gray-900">
                                    Include Business Expenses
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
                <div style={{ width: "100%", height: 400 }}>
                    {displayData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={displayData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="day"
                                    label={{
                                        value: "Day of Month",
                                        position: "insideBottom",
                                        offset: -5,
                                    }}
                                />
                                <YAxis
                                    tickFormatter={(value) => formatNumber(value)}
                                    width={80}
                                />
                                <Tooltip
                                    formatter={(value: number) => [
                                        formatNumber(value),
                                        "Daily Total",
                                    ]}
                                    labelFormatter={(day) => {
                                        const dataPoint = displayData.find(
                                            (d) => d.day === day
                                        );
                                        return `Date: ${dataPoint?.fullDate}`;
                                    }}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    name={includeBusinessExpenses ? "Daily Expense" : "Daily Expense (excl. Business)"}
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    fillOpacity={0.6}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p>No expenses recorded for {monthName}</p>
                        </div>
                    )}
                </div>
                
                {/* Category expenses for this month section */}
                <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Category Expenses for {monthName}</h3>
                    {displayCategories.length > 0 ? (
                        <div className="space-y-4">
                            {displayCategories.map((category) => {
                                const isExpanded = expandedCategories[category.name] || false;
                                
                                return (
                                    <div 
                                        key={category.name} 
                                        className="border rounded-md shadow-sm overflow-hidden"
                                    >
                                        <div 
                                            className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => {
                                                setExpandedCategories({
                                                    ...expandedCategories,
                                                    [category.name]: !isExpanded
                                                });
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                <div className="font-medium">{category.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    ({category.expenses.length} transactions)
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <span>
                                                    {formatNumber(category.amount)}
                                                </span>
                                                <span className="text-gray-500">
                                                    ({category.percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {isExpanded && (
                                            <div className="bg-white p-3">
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {category.expenses.map((expense) => (
                                                                <tr key={expense.id} className="hover:bg-gray-50">
                                                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{expense.date}</td>
                                                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                                                        {formatNumber(expense.amount)}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-sm text-gray-500">{expense.comment || "-"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p>No category data available for {monthName}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CurrentMonthExpensesChart;