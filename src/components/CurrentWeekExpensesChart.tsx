import React, { useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

// Interface for detailed expense structure
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

interface CurrentWeekExpensesChartProps {
    expenses: Expense[];
}

const CurrentWeekExpensesChart: React.FC<CurrentWeekExpensesChartProps> = ({
    expenses,
}) => {
    // State to track which categories are expanded
    const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});

    // Process data to get current and previous week's expenses and categories
    const { currentWeekData, weeklyTotal, weeklyCategories, weekStart, weekEnd, previousWeekTotal } = useMemo(() => {
        // Get precise date string in YYYY-MM-DD format
        function getDateString(date: Date): string {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }

        // Format date for display
        function formatDateForDisplay(dateStr: string): string {
            const date = new Date(dateStr);
            return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
        }

        // Get the current date
        const now = new Date();

        // Get the day of week (0 = Sunday, 1 = Monday, etc.)
        const dayOfWeek = now.getDay();

        // Create a new date object for the start of the week (Monday)
        const weekStart = new Date(now);

        if (dayOfWeek === 1) {
            // Today is Monday, just use today
            console.log("Today is Monday, using today for week start");
        } else {
            // Go back to the most recent Monday
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            weekStart.setDate(now.getDate() - daysToSubtract);
        }

        // Set to start of day
        weekStart.setHours(0, 0, 0, 0);
        
        // Calculate the end of the week (Sunday)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        // Calculate previous week start (7 days before current week start)
        const previousWeekStart = new Date(weekStart);
        previousWeekStart.setDate(previousWeekStart.getDate() - 7);
        
        // Calculate previous week end (7 days before current week end)
        const previousWeekEnd = new Date(weekEnd);
        previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);

        // Define the structure for day data
        interface DayData {
            day: string;
            date: string;
            displayDate: string;
            amount: number;
        }

        // Initialize the days of the week
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const currentWeekDays: DayData[] = [];
        const previousWeekDays: DayData[] = [];

        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        // Generate data for each day of the current week
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + i);

            const dateStr = getDateString(currentDay);
            
            currentWeekDays.push({
                day: dayNames[i],
                date: dateStr,
                displayDate: `${currentDay.getDate()} ${
                    monthNames[currentDay.getMonth()]
                }`,
                amount: 0,
            });
        }
        
        // Generate data for each day of the previous week
        for (let i = 0; i < 7; i++) {
            const previousDay = new Date(previousWeekStart);
            previousDay.setDate(previousWeekStart.getDate() + i);

            const dateStr = getDateString(previousDay);
            
            previousWeekDays.push({
                day: dayNames[i],
                date: dateStr,
                displayDate: `${previousDay.getDate()} ${
                    monthNames[previousDay.getMonth()]
                }`,
                amount: 0,
            });
        }

        // Track total amounts
        let currentWeekTotal = 0;
        let previousWeekTotal = 0;
        
        // Filter expenses for the current week
        const currentWeekExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= weekStart && expenseDate <= weekEnd;
        });
        
        // Filter expenses for the previous week
        const previousWeekExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= previousWeekStart && expenseDate <= previousWeekEnd;
        });

        // Process current week expense data
        currentWeekExpenses.forEach((expense) => {
            // Extract the date part (YYYY-MM-DD) from the expense date
            const expenseDateStr = expense.date.split("T")[0];

            // Find the matching day in our current week data
            const dayData = currentWeekDays.find(
                (day) => day.date === expenseDateStr
            );

            if (dayData) {
                dayData.amount += expense.amount;
                currentWeekTotal += expense.amount;
            }
        });
        
        // Process previous week expense data
        previousWeekExpenses.forEach((expense) => {
            // Extract the date part (YYYY-MM-DD) from the expense date
            const expenseDateStr = expense.date.split("T")[0];

            // Find the matching day in our previous week data
            const dayData = previousWeekDays.find(
                (day) => day.date === expenseDateStr
            );

            if (dayData) {
                dayData.amount += expense.amount;
                previousWeekTotal += expense.amount;
            }
        });

        // Group expenses by category and store individual expenses
        const categoryMap = new Map<string, CategoryWithExpenses>();
        
        currentWeekExpenses.forEach((expense) => {
            const categoryName = expense.category.name;
            
            if (categoryMap.has(categoryName)) {
                const category = categoryMap.get(categoryName);
                if (category) {
                    category.amount += expense.amount;
                    category.expenses.push({
                        id: expense.id,
                        date: formatDateForDisplay(expense.date),
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
                        date: formatDateForDisplay(expense.date),
                        amount: expense.amount,
                        comment: expense.comment
                    }]
                });
            }
        });
        
        // Calculate percentages and sort categories by amount (descending)
        const categoryResults: CategoryWithExpenses[] = Array.from(categoryMap.values());
        categoryResults.forEach(category => {
            category.percentage = (category.amount / currentWeekTotal) * 100;
            
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
        
        // Create combined data for the chart (includes current week and previous week data)
        const combinedChartData = dayNames.map((day, index) => {
            return {
                day,
                displayDate: currentWeekDays[index].displayDate,
                currentWeek: currentWeekDays[index].amount,
                previousWeek: previousWeekDays[index].amount,
                currentDate: currentWeekDays[index].date,
                previousDate: previousWeekDays[index].date
            };
        });

        return {
            currentWeekData: combinedChartData,
            weeklyTotal: currentWeekTotal,
            previousWeekTotal: previousWeekTotal,
            weeklyCategories: categoryResults,
            weekStart: weekStart.toLocaleDateString("en-GB"),
            weekEnd: weekEnd.toLocaleDateString("en-GB")
        };
    }, [expenses]);

    return (
        <Card className="shadow-md">
            <CardContent className="p-4">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="text-xl font-semibold">
                        Current Week Expenses ({weekStart} to {weekEnd})
                    </div>
                    <div className="flex flex-row gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <div className="text-lg">
                                Current Week Total:{" "}
                                {Number.isInteger(weeklyTotal)
                                    ? weeklyTotal
                                    : weeklyTotal.toFixed(2)}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-purple-500 rounded"></div>
                            <div className="text-lg">
                                Previous Week Total:{" "}
                                {Number.isInteger(previousWeekTotal)
                                    ? previousWeekTotal
                                    : previousWeekTotal.toFixed(2)}
                            </div>
                        </div>
                        <div className="text-lg ml-4">
                            Week-over-Week:{" "}
                            <span className={previousWeekTotal > 0 
                                ? (weeklyTotal > previousWeekTotal ? "text-red-500" : "text-green-500") 
                                : ""}>
                                {previousWeekTotal > 0 
                                    ? (((weeklyTotal - previousWeekTotal) / previousWeekTotal) * 100).toFixed(1) + "%" 
                                    : "N/A"}
                            </span>
                        </div>
                    </div>
                </div>
                <div style={{ width: "100%", height: 400 }}>
                    {weeklyTotal > 0 || previousWeekTotal > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={currentWeekData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="day"
                                    tickFormatter={(day, index) => {
                                        const data = currentWeekData[index];
                                        return `${day}\n${data.displayDate}`;
                                    }}
                                    height={60}
                                />
                                <YAxis
                                    tickFormatter={(value) =>
                                        Number.isInteger(value)
                                            ? value.toString()
                                            : value.toFixed(2)
                                    }
                                    width={80}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const currentWeekValue = payload.find(p => p.dataKey === "currentWeek")?.value;
                                            const previousWeekValue = payload.find(p => p.dataKey === "previousWeek")?.value;
                                            const data = currentWeekData.find(d => d.day === label);
                                            
                                            // Convert to numbers for safe comparison
                                            const currentWeekNum = currentWeekValue !== undefined ? Number(currentWeekValue) : 0;
                                            const previousWeekNum = previousWeekValue !== undefined ? Number(previousWeekValue) : 0;
                                            
                                            return (
                                                <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
                                                    <p className="font-semibold">{`${label} ${data?.displayDate}`}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Current Week: <span className="font-medium text-green-600">
                                                            {Number.isInteger(currentWeekNum) 
                                                                ? currentWeekNum 
                                                                : currentWeekNum.toFixed(2)}
                                                        </span>
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Previous Week: <span className="font-medium text-purple-600">
                                                            {Number.isInteger(previousWeekNum) 
                                                                ? previousWeekNum 
                                                                : previousWeekNum.toFixed(2)}
                                                        </span>
                                                    </p>
                                                    {previousWeekNum > 0 && (
                                                        <p className="text-sm text-gray-600">
                                                            Change: <span className={
                                                                currentWeekNum > previousWeekNum ? "text-red-500" : "text-green-500"
                                                            }>
                                                                {((currentWeekNum - previousWeekNum) / previousWeekNum * 100).toFixed(1)}%
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend 
                                    payload={[
                                        { value: 'Current Week', type: 'square', color: '#82ca9d' },
                                        { value: 'Previous Week', type: 'square', color: '#8884d8' }
                                    ]}
                                />
                                <Bar
                                    dataKey="currentWeek"
                                    name="Current Week"
                                    fill="#82ca9d"
                                />
                                <Bar
                                    dataKey="previousWeek"
                                    name="Previous Week"
                                    fill="#8884d8"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p>No expenses recorded for the current week</p>
                        </div>
                    )}
                </div>
                
                {/* Category expenses for this week section */}
                <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Category Expenses for Current Week</h3>
                    {weeklyCategories.length > 0 ? (
                        <div className="space-y-4">
                            {weeklyCategories.map((category) => {
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
                                                    {Number.isInteger(category.amount)
                                                        ? category.amount
                                                        : category.amount.toFixed(2)}
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
                                                                        {Number.isInteger(expense.amount) 
                                                                            ? expense.amount 
                                                                            : expense.amount.toFixed(2)}
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
                        <p>No category data available for the current week</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CurrentWeekExpensesChart;