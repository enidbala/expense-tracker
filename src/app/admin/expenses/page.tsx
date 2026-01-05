"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ExpensesList from "@/components/ExpensesList";
import AllExpensesChart from "@/components/AllExpensesChart";
import MonthlyExpensesChart from "@/components/MonthlyExpensesChart";
import CurrentMonthExpensesChart from "@/components/CurrentMonthExpensesChart";
import CurrentWeekExpensesChart from "@/components/CurrentWeekExpensesChart";

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

type DailyExpense = {
  date: string;
  amount: number;
};

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
            .order("date", { ascending: true })
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

        // Fetch daily aggregated expenses
        const { data: dailyData, error: dailyError } = await supabase.rpc("get_daily_expenses");
        if (dailyError) throw dailyError;
        setDailyExpenses(dailyData as DailyExpense[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllExpenses();
  }, []);

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!expenses.length) return <div>No expenses found</div>;

  return (
    <div className="space-y-8">
      {/* Current Period Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CurrentMonthExpensesChart expenses={expenses} />
        <CurrentWeekExpensesChart expenses={expenses} />
      </div>

      {/* Historical Charts */}
      <div className="space-y-6">
        <MonthlyExpensesChart expenses={dailyExpenses} />
        <AllExpensesChart expenses={dailyExpenses} />
      </div>

      {/* Detailed Expenses List */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50">
        <ExpensesList expenses={expenses} onDelete={handleDelete} onUpdate={handleUpdate} />
      </div>
    </div>
  );
};

export default ExpensesPage;