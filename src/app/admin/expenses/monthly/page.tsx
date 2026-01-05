"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import ExpensesList from "@/components/ExpensesList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Expense = {
  id: string;
  comment: string;
  amount: number;
  category: {
    id: string;
    name: string;
  };
  date: string;
};

type MonthlyData = {
  month: string;
  year: number;
  expenses: Expense[];
  total: number;
  count: number;
  averagePerDay: number;
  categories: { [key: string]: { total: number; count: number } };
};

type CategorySummary = {
  name: string;
  total: number;
  count: number;
  percentage: number;
};

type YearlyChartData = {
  month: string;
  monthNumber: number;
  total: number;
  category1: number;
  category1Name: string;
  category2: number;
  category2Name: string;
  category3: number;
  category3Name: string;
};

export default function MonthlyPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    const fetchAllExpenses = async () => {
      try {
        // Fetch all expenses in chunks of 1000
        let allExpenses: Expense[] = [];
        let from = 0;
        const pageSize = 1000;
        let fetchMore = true;

        while (fetchMore) {
          const { data, error: fetchError } = await supabase
            .from("expenses")
            .select(
              `
                *,
                category:expense_categories(id, name)
              `
            )
            .order("date", { ascending: false })
            .range(from, from + pageSize - 1);

          if (fetchError) throw fetchError;

          if (data && data.length > 0) {
            allExpenses = allExpenses.concat(data as Expense[]);
            from += pageSize;
          }

          if (!data || data.length < pageSize) {
            fetchMore = false;
          }
        }

        setExpenses(allExpenses);

        // Set default selected month to current month if not set
        if (!selectedMonth && allExpenses.length > 0) {
          const currentDate = new Date();
          const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
          setSelectedMonth(currentMonthKey);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllExpenses();
  }, []);

  // Group expenses by month
  const monthlyData = useMemo(() => {
    const grouped: { [key: string]: MonthlyData } = {};

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-GB', { month: 'long' });
      
      if (!grouped[monthKey]) {
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        grouped[monthKey] = {
          month: monthName,
          year: date.getFullYear(),
          expenses: [],
          total: 0,
          count: 0,
          averagePerDay: 0,
          categories: {}
        };
      }

      grouped[monthKey].expenses.push(expense);
      grouped[monthKey].total += expense.amount;
      grouped[monthKey].count += 1;

      // Category breakdown
      const categoryName = expense.category?.name || 'Uncategorized';
      if (!grouped[monthKey].categories[categoryName]) {
        grouped[monthKey].categories[categoryName] = { total: 0, count: 0 };
      }
      grouped[monthKey].categories[categoryName].total += expense.amount;
      grouped[monthKey].categories[categoryName].count += 1;
    });

    // Calculate average per day for each month
    Object.keys(grouped).forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      grouped[monthKey].averagePerDay = grouped[monthKey].total / daysInMonth;
    });

    return grouped;
  }, [expenses]);

  // Get sorted month keys
  const sortedMonthKeys = useMemo(() => {
    return Object.keys(monthlyData).sort((a, b) => b.localeCompare(a)); // Most recent first
  }, [monthlyData]);

  // Set default month if not selected and data is available
  useEffect(() => {
    if (!selectedMonth && sortedMonthKeys.length > 0) {
      setSelectedMonth(sortedMonthKeys[0]);
    }
  }, [selectedMonth, sortedMonthKeys]);

  const currentMonthData = selectedMonth ? monthlyData[selectedMonth] : null;

  // Get category summary for current month
  const categorySummary: CategorySummary[] = useMemo(() => {
    if (!currentMonthData) return [];

    return Object.entries(currentMonthData.categories)
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        percentage: (data.total / currentMonthData.total) * 100
      }))
      .sort((a, b) => b.total - a.total);
  }, [currentMonthData]);

  // Generate yearly chart data with top 3 categories per month
  const yearlyChartData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const chartData: YearlyChartData[] = [];

    // Create data for each month of the current year
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${currentYear}-${String(month).padStart(2, '0')}`;
      const monthData = monthlyData[monthKey];
      const monthName = new Date(currentYear, month - 1).toLocaleDateString('en-GB', { month: 'short' });

      if (monthData) {
        // Get top 3 categories for this month
        const topCategories = Object.entries(monthData.categories)
          .map(([name, data]) => ({ name, total: data.total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 3);

        chartData.push({
          month: monthName,
          monthNumber: month,
          total: monthData.total,
          category1: topCategories[0]?.total || 0,
          category1Name: topCategories[0]?.name || '',
          category2: topCategories[1]?.total || 0,
          category2Name: topCategories[1]?.name || '',
          category3: topCategories[2]?.total || 0,
          category3Name: topCategories[2]?.name || '',
        });
      } else {
        // No data for this month
        chartData.push({
          month: monthName,
          monthNumber: month,
          total: 0,
          category1: 0,
          category1Name: '',
          category2: 0,
          category2Name: '',
          category3: 0,
          category3Name: '',
        });
      }
    }

    return chartData;
  }, [monthlyData]);

  // Get all unique category names for consistent coloring
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    yearlyChartData.forEach(month => {
      if (month.category1Name) categories.add(month.category1Name);
      if (month.category2Name) categories.add(month.category2Name);
      if (month.category3Name) categories.add(month.category3Name);
    });
    return Array.from(categories);
  }, [yearlyChartData]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">{`${label} ${new Date().getFullYear()}`}</p>
          <p className="text-sm text-gray-600 mb-2">{`Total: ${data.total.toFixed(2)}`}</p>
          {data.category1Name && (
            <p className="text-sm" style={{ color: '#8884d8' }}>
              {`${data.category1Name}: ${data.category1.toFixed(2)}`}
            </p>
          )}
          {data.category2Name && (
            <p className="text-sm" style={{ color: '#82ca9d' }}>
              {`${data.category2Name}: ${data.category2.toFixed(2)}`}
            </p>
          )}
          {data.category3Name && (
            <p className="text-sm" style={{ color: '#ffc658' }}>
              {`${data.category3Name}: ${data.category3.toFixed(2)}`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Get previous month data for comparison
  const getPreviousMonthData = () => {
    const currentIndex = sortedMonthKeys.indexOf(selectedMonth);
    if (currentIndex < sortedMonthKeys.length - 1) {
      const previousMonthKey = sortedMonthKeys[currentIndex + 1];
      return monthlyData[previousMonthKey];
    }
    return null;
  };

  const previousMonthData = getPreviousMonthData();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const currentIndex = sortedMonthKeys.indexOf(selectedMonth);
    if (direction === 'prev' && currentIndex < sortedMonthKeys.length - 1) {
      setSelectedMonth(sortedMonthKeys[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedMonth(sortedMonthKeys[currentIndex - 1]);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw new Error(error.message);

      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  };

  const handleUpdate = async (updatedExpense: Expense) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          comment: updatedExpense.comment,
          amount: updatedExpense.amount,
          date: updatedExpense.date,
        })
        .eq("id", updatedExpense.id);

      if (error) throw new Error(error.message);

      setExpenses((prev) =>
        prev.map((expense) => (expense.id === updatedExpense.id ? updatedExpense : expense))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update expense");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">Error: {error}</div>;
  if (!expenses.length) return <div className="text-center text-gray-500">No expenses found</div>;

  const currentIndex = sortedMonthKeys.indexOf(selectedMonth);
  const canGoPrev = currentIndex < sortedMonthKeys.length - 1;
  const canGoNext = currentIndex > 0;

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="h-6 w-6" />
              <CardTitle className="text-2xl">
                {currentMonthData ? `${currentMonthData.month} ${currentMonthData.year}` : 'Monthly Expenses'}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                disabled={!canGoPrev}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                disabled={!canGoNext}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Month Overview Cards */}
      {currentMonthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold">
                    {Number.isInteger(currentMonthData.total) 
                      ? currentMonthData.total.toString() 
                      : currentMonthData.total.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              {previousMonthData && (
                <div className="flex items-center mt-2">
                  {currentMonthData.total > previousMonthData.total ? (
                    <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                  )}
                  <span className={`text-sm ${currentMonthData.total > previousMonthData.total ? 'text-red-500' : 'text-green-500'}`}>
                    {((currentMonthData.total - previousMonthData.total) / previousMonthData.total * 100).toFixed(1)}% 
                    vs last month
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold">{currentMonthData.count}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              {previousMonthData && (
                <div className="flex items-center mt-2">
                  {currentMonthData.count > previousMonthData.count ? (
                    <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-gray-500 mr-1" />
                  )}
                  <span className="text-sm text-gray-600">
                    {currentMonthData.count - previousMonthData.count} vs last month
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Daily Average</p>
                  <p className="text-2xl font-bold">
                    {Number.isInteger(currentMonthData.averagePerDay) 
                      ? currentMonthData.averagePerDay.toString() 
                      : currentMonthData.averagePerDay.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600 mt-2">Per day this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Top Category</p>
                  <p className="text-lg font-bold">{categorySummary[0]?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    {categorySummary[0] ? categorySummary[0].percentage.toFixed(1) : '0'}% of total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Yearly Overview Chart */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>Year Overview - Top 3 Categories per Month</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="category1" 
                  stackId="a" 
                  fill="#8884d8" 
                  name="Top Category"
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="category2" 
                  stackId="a" 
                  fill="#82ca9d" 
                  name="2nd Category"
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="category3" 
                  stackId="a" 
                  fill="#ffc658" 
                  name="3rd Category"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Navigation from Chart */}
          <div className="mt-4 flex flex-wrap gap-2">
            {yearlyChartData.filter(month => month.total > 0).map((month) => (
              <Button
                key={month.monthNumber}
                variant={selectedMonth === `${new Date().getFullYear()}-${String(month.monthNumber).padStart(2, '0')}` ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMonth(`${new Date().getFullYear()}-${String(month.monthNumber).padStart(2, '0')}`)}
                className="text-xs"
              >
                {month.month}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {currentMonthData && categorySummary.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorySummary.map((category) => (
                <div key={category.name} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-gray-600">{category.count} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {Number.isInteger(category.total) 
                        ? category.total.toString() 
                        : category.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month Selector (Mobile Friendly) */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Quick Month Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {sortedMonthKeys.slice(0, 12).map((monthKey) => {
              const data = monthlyData[monthKey];
              return (
                <Button
                  key={monthKey}
                  variant={selectedMonth === monthKey ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMonth(monthKey)}
                  className="text-xs"
                >
                  {data.month.slice(0, 3)} {data.year}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Expenses List for Selected Month */}
      {currentMonthData && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            {currentMonthData.month} {currentMonthData.year} Expenses ({currentMonthData.count} transactions)
          </h3>
          <ExpensesList 
            expenses={currentMonthData.expenses} 
            onDelete={handleDelete} 
            onUpdate={handleUpdate} 
          />
        </div>
      )}
    </div>
  );
}